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
});

export async function POST(req: NextRequest) {
  try { return await handleChat(req); } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e), escalated: true }, { status: 500 }); }
}

async function handleChat(req: NextRequest) {
  let body: z.infer<typeof chatSchema>;
  try { body = chatSchema.parse(await req.json()); } catch (e) { return NextResponse.json({ error: "Invalid request", details: String(e) }, { status: 400 }); }

  // Get or create conversation
  let conv;
  if (body.conversationId) {
    conv = await db.query.conversations.findFirst({ where: eq(conversations.id, body.conversationId) });
  }
  if (!conv) {
    const [c] = await db.insert(conversations).values({ publicId: body.publicId ?? publicId("conv_"), visitorName: body.visitor?.name, visitorEmail: body.visitor?.email, visitorPhone: body.visitor?.phone }).returning();
    conv = c;
  }

  // Update visitor info if provided
  if (body.visitor?.name && body.visitor.name !== conv.visitorName) {
    await db.update(conversations).set({ visitorName: body.visitor.name, visitorEmail: body.visitor.email ?? conv.visitorEmail, visitorPhone: body.visitor.phone ?? conv.visitorPhone }).where(eq(conversations.id, conv.id));
    conv.visitorName = body.visitor.name;
  }

  // Detect name from message if not set
  if (!conv.visitorName) {
    const nameMatch = body.message.match(/(?:my name is|i am|i'm|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    if (nameMatch) {
      conv.visitorName = nameMatch[1].trim();
      await db.update(conversations).set({ visitorName: conv.visitorName }).where(eq(conversations.id, conv.id));
    }
  }

  // Detect email/phone from message
  const emailMatch = body.message.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = body.message.match(/(?:\+?\d{1,3}[-.\s]?)?\d{10,14}/);
  if (emailMatch && !conv.visitorEmail) { await db.update(conversations).set({ visitorEmail: emailMatch[0] }).where(eq(conversations.id, conv.id)); conv.visitorEmail = emailMatch[0]; }
  if (phoneMatch && !conv.visitorPhone) { await db.update(conversations).set({ visitorPhone: phoneMatch[0] }).where(eq(conversations.id, conv.id)); conv.visitorPhone = phoneMatch[0]; }

  await db.insert(messages).values({ conversationId: conv.id, role: "user", content: body.message }).returning();

  // Create lead if we have name or email
  if (conv.visitorName || conv.visitorEmail) {
    const existing = await db.query.leads.findFirst({ where: eq(leads.conversationId, conv.id) });
    if (!existing) {
      await db.insert(leads).values({ conversationId: conv.id, name: conv.visitorName, email: conv.visitorEmail, phone: conv.visitorPhone, status: "new", serviceInterest: "Chat inquiry" });
      await db.update(conversations).set({ isLead: true }).where(eq(conversations.id, conv.id));
    }
  }

  // Create ticket ONLY ONCE
  const wantsEscalation = body.escalate || /ticket|human|manager|executive|speak to|someone in charge|complaint|complain/i.test(body.message);
  if (wantsEscalation) {
    const existing = await db.query.tickets.findFirst({ where: eq(tickets.conversationId, conv.id) });
    if (!existing) {
      const [ticket] = await db.insert(tickets).values({ ticketNumber: ticketNumber(), conversationId: conv.id, subject: "Visitor requested escalation", description: body.message.slice(0, 300), priority: "medium", visitorName: conv.visitorName, visitorEmail: conv.visitorEmail, visitorPhone: conv.visitorPhone }).returning();
      await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
      await db.insert(activityLogs).values({ actor: conv.visitorEmail ?? "visitor", action: "ticket.created", entityType: "ticket", entityId: ticket.id, details: { ticketNumber: ticket.ticketNumber } });
    }
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
          await db.insert(messages).values({ conversationId: conv.id, role: "assistant", content: fullText, aiGenerated: true, latencyMs: meta.latencyMs }).returning();
          await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "done", conversationId: conv.id, escalated: wantsEscalation, latencyMs: meta.latencyMs })}\n\n`));
          controller.close();
        },
        onError: async () => { await db.insert(messages).values({ conversationId: conv.id, role: "assistant", content: "I'm having trouble responding right now.", aiGenerated: false, escalated: true }).returning(); controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", escalated: true })}\n\n`)); controller.close(); },
      });
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}