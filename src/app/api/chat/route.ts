import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages, leads, activityLogs } from "@/lib/db/schema";
import { publicId } from "@/lib/utils";
import { buildSystemMessage } from "@/lib/ai";

/**
 * Chat API — handles the full lifecycle of a visitor conversation:
 *   - Creating / resuming conversations
 *   - Persisting user + assistant messages
 *   - Streaming responses from Longcat
 *   - Triggering ticket creation on escalation
 *   - Capturing sales leads
 *
 * Endpoints:
 *   POST /api/chat        -> stream a response (SSE)
 */

// ── Schemas ──────────────────────────────────────────────────────────────────

const chatSchema = z.object({
  conversationId: z.string().optional(),
  publicId: z.string().optional(),
  message: z.string().min(1, "message required"),
  visitor: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      page: z.string().optional(),
    })
    .optional(),
  // When true, the visitor explicitly asked to escalate / open a ticket
  escalate: z.boolean().optional(),
  // Lead capture payload (optional, sent alongside a message)
  lead: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      serviceInterest: z.string().optional(),
      budget: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOrCreateConversation(input: z.infer<typeof chatSchema>) {
  if (input.conversationId) {
    const existing = await db.query.conversations.findFirst({
      where: eq(conversations.id, input.conversationId),
    });
    if (existing) return existing;
  }

  const created = await db
    .insert(conversations)
    .values({
      publicId: input.publicId ?? publicId("conv_"),
      visitorName: input.visitor?.name,
      visitorEmail: input.visitor?.email,
      visitorPhone: input.visitor?.phone,
      sourceUrl: input.visitor?.page,
    })
    .returning();

  return created[0];
}

async function persistMessage(values: typeof messages.$inferInsert) {
  const [m] = await db.insert(messages).values(values).returning();
  return m;
}

async function appendActivityLog(values: typeof activityLogs.$inferInsert) {
  await db.insert(activityLogs).values(values);
}

// ── POST /api/chat ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: z.infer<typeof chatSchema>;
  try {
    body = chatSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid request", details: String(e) }, { status: 400 });
  }

  const conv = await getOrCreateConversation(body);

  // Persist the user message
  await persistMessage({
    conversationId: conv.id,
    role: "user",
    content: body.message,
  });

  // Handle explicit escalation / ticket request
  if (body.escalate) {
    await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
  }

  // Handle optional lead capture
  if (body.lead && (body.lead.email || body.lead.name)) {
    const [lead] = await db
      .insert(leads)
      .values({
        conversationId: conv.id,
        name: body.lead.name,
        email: body.lead.email,
        phone: body.lead.phone,
        company: body.lead.company,
        serviceInterest: body.lead.serviceInterest,
        budget: body.lead.budget,
        notes: body.lead.notes,
      })
      .returning();
    await db.update(conversations).set({ isLead: true }).where(eq(conversations.id, conv.id));
    await appendActivityLog({
      actor: body.lead.email ?? "visitor",
      action: "lead.created",
      entityType: "lead",
      entityId: lead.id,
      details: { serviceInterest: body.lead.serviceInterest ?? null },
    });
  }

  // Build conversation history for the AI
  const past = await db.query.messages.findMany({
    where: eq(messages.conversationId, conv.id),
    orderBy: (m, { asc }) => asc(m.createdAt),
    limit: 50,
  });

  const history = past.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  const systemMsg = buildSystemMessage({
    name: body.visitor?.name ?? conv.visitorName,
    email: body.visitor?.email ?? conv.visitorEmail,
    page: body.visitor?.page ?? conv.sourceUrl,
  });

  // Stream the AI response
  const client = (await import("@/lib/ai")).getAiClient();

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = "";
      let tokensOut = 0;

      controller.enqueue(
        enc.encode(
          `data: ${JSON.stringify({ type: "meta", conversationId: conv.id, publicId: conv.publicId })}\n\n`
        )
      );

      await client.stream([systemMsg, ...history], {
        onToken: (token) => {
          fullText += token;
          tokensOut++;
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`));
        },
        onDone: async (meta) => {
          // Persist assistant message
          const isEscalation =
            body.escalate ||
            /ticket|escalat|human|manager|executive|speak to|someone in charge/i.test(fullText) ||
            /ticket|escalat|human|manager|executive/i.test(body.message);

          await persistMessage({
            conversationId: conv.id,
            role: "assistant",
            content: fullText,
            aiGenerated: true,
            escalated: isEscalation,
            tokensOut: meta.tokensOut ?? tokensOut,
            latencyMs: meta.latencyMs,
          });

          await db
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, conv.id));

          if (isEscalation) {
            await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
          }

          controller.enqueue(
            enc.encode(
              `data: ${JSON.stringify({
                type: "done",
                conversationId: conv.id,
                escalated: isEscalation,
                latencyMs: meta.latencyMs,
              })}\n\n`
            )
          );
          controller.close();
        },
        onError: async (err) => {
          await persistMessage({
            conversationId: conv.id,
            role: "assistant",
            content:
              "I'm sorry — I'm having trouble responding right now. Please try again in a moment, or I can open a ticket for a senior executive to assist you.",
            aiGenerated: false,
            escalated: true,
          });
          controller.enqueue(
            enc.encode(
              `data: ${JSON.stringify({ type: "error", message: "AI generation failed", escalated: true })}\n\n`
            )
          );
          controller.close();
        },
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
