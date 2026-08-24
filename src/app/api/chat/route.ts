import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages, leads, tickets, activityLogs } from "@/lib/db/schema";
import { publicId, ticketNumber } from "@/lib/utils";
import { buildSystemMessage } from "@/lib/ai";
import { sendTicketNotification } from "@/lib/email";

const chatSchema = z.object({
  conversationId: z.string().optional(),
  publicId: z.string().optional(),
  message: z.string().min(1),
  visitor: z.object({ name: z.string().optional(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  escalate: z.boolean().optional(),
  lead: z.object({ name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), company: z.string().optional(), serviceInterest: z.string().optional(), budget: z.string().optional(), notes: z.string().optional() }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    return await handleChat(req);
  } catch (e: any) {
    console.error("[api/chat] error:", e);
    return NextResponse.json({ error: "Internal server error", message: String(e?.message ?? e), escalated: true }, { status: 500 });
  }
}

async function handleChat(req: NextRequest) {
  let body: z.infer<typeof chatSchema>;
  try { body = chatSchema.parse(await req.json()); } catch (e) { return NextResponse.json({ error: "Invalid request", details: String(e) }, { status: 400 }); }

  // Get or create conversation, update visitor name if provided
  let conv;
  if (body.conversationId) {
    conv = await db.query.conversations.findFirst({ where: eq(conversations.id, body.conversationId) });
  }
  if (!conv) {
    const [c] = await db.insert(conversations).values({ publicId: body.publicId ?? publicId("conv_"), visitorName: body.visitor?.name, visitorEmail: body.visitor?.email, visitorPhone: body.visitor?.phone }).returning();
    conv = c;
  } else if (body.visitor?.name && !conv.visitorName) {
    await db.update(conversations).set({ visitorName: body.visitor.name, visitorEmail: body.visitor.email, visitorPhone: body.visitor.phone }).where(eq(conversations.id, conv.id));
    conv.visitorName = body.visitor.name;
  }

  await persistMessage({ conversationId: conv.id, role: "user", content: body.message });

  // Handle lead capture
  if (body.lead && (body.lead.email || body.lead.name)) {
    await db.insert(leads).values({ conversationId: conv.id, name: body.lead.name, email: body.lead.email, phone: body.lead.phone, company: body.lead.company, serviceInterest: body.lead.serviceInterest, budget: body.lead.budget, notes: body.lead.notes });
    await db.update(conversations).set({ isLead: true }).where(eq(conversations.id, conv.id));
  }

  // Handle explicit escalation — create ticket
  if (body.escalate) {
    const [ticket] = await db.insert(tickets).values({ ticketNumber: ticketNumber(), conversationId: conv.id, subject: "Visitor requested escalation", description: body.message, priority: "medium", visitorName: conv.visitorName, visitorEmail: conv.visitorEmail, visitorPhone: conv.visitorPhone }).returning();
    await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
    await db.insert(activityLogs).values({ actor: conv.visitorEmail ?? "visitor", action: "ticket.created", entityType: "ticket", entityId: ticket.id, details: { ticketNumber: ticket.ticketNumber } });
    if (ticket.assignedTo) sendTicketNotification(ticket).catch(() => {});
  }

  const past = await db.query.messages.findMany({ where: eq(messages.conversationId, conv.id), orderBy: (m, { asc }) => asc(m.createdAt), limit: 50 });
  const history = past.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));
  const systemMsg = buildSystemMessage({ name: conv.visitorName, email: conv.visitorEmail, page: conv.sourceUrl });

  const client = (await import("@/lib/ai")).getAiClient();
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = "";
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "meta", conversationId: conv.id, publicId: conv.publicId })}\n\n`));
      await client.stream([systemMsg, ...history], {
        onToken: (token) => { fullText += token; controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`)); },
        onDone: async (meta) => {
          const isEscalation = body.escalate || /ticket|escalat|human|manager|executive|speak to|someone in charge/i.test(fullText) || /ticket|escalat|human|manager|executive/i.test(body.message);
          await persistMessage({ conversationId: conv.id, role: "assistant", content: fullText, aiGenerated: true, escalated: isEscalation, tokensOut: meta.tokensOut, latencyMs: meta.latencyMs });
          await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));
          // Auto-create ticket if AI detected escalation intent
          if (isEscalation && !body.escalate) {
            const [ticket] = await db.insert(tickets).values({ ticketNumber: ticketNumber(), conversationId: conv.id, subject: "Escalation detected", description: fullText.slice(0, 200), priority: "medium", visitorName: conv.visitorName, visitorEmail: conv.visitorEmail }).returning();
            await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
            if (ticket.assignedTo) sendTicketNotification(ticket).catch(() => {});
          }
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "done", conversationId: conv.id, escalated: isEscalation, latencyMs: meta.latencyMs })}\n\n`));
          controller.close();
        },
        onError: async () => { await persistMessage({ conversationId: conv.id, role: "assistant", content: "I'm sorry — I'm having trouble responding right now.", aiGenerated: false, escalated: true }); controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", escalated: true })}\n\n`)); controller.close(); },
      });
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}

async function persistMessage(values: any) { await db.insert(messages).values(values).returning(); }