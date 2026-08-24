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

  let conv;
  if (body.conversationId) { conv = await db.query.conversations.findFirst({ where: eq(conversations.id, body.conversationId) }); }
  if (!conv) { const [c] = await db.insert(conversations).values({ publicId: body.publicId ?? publicId("conv_"), visitorName: body.visitor?.name, visitorEmail: body.visitor?.email, visitorPhone: body.visitor?.phone }).returning(); conv = c; }

  // Update visitor info if provided
  if (body.visitor?.name && body.visitor.name !== conv.visitorName) {
    await db.update(conversations).set({ visitorName: body.visitor.name, visitorEmail: body.visitor.email ?? conv.visitorEmail, visitorPhone: body.visitor.phone ?? conv.visitorPhone }).where(eq(conversations.id, conv.id));
    conv.visitorName = body.visitor.name;
    // Also update existing tickets with the name
    await db.update(tickets).set({ visitorName: body.visitor.name }).where(eq(tickets.conversationId, conv.id));
    // Also update existing leads with the name
    await db.update(leads).set({ name: body.visitor.name }).where(eq(leads.conversationId, conv.id));
  }

  // Detect name from message if not set
  if (!conv.visitorName) {
    var namePatterns = [/my name is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i, /i am\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i, /i'm\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i, /call me\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i, /this is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i, /name[:\s]+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i];
    for (var i = 0; i < namePatterns.length; i++) { var match = body.message.match(namePatterns[i]); if (match) { conv.visitorName = match[1].trim(); await db.update(conversations).set({ visitorName: conv.visitorName }).where(eq(conversations.id, conv.id)); break; } }
  }

  // Detect email/phone from message
  var emailMatch = body.message.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  var phoneMatch = body.message.match(/(?:\+?\d{1,3}[-.\s]?)?\d{10,14}/);
  if (emailMatch && !conv.visitorEmail) { conv.visitorEmail = emailMatch[0]; await db.update(conversations).set({ visitorEmail: conv.visitorEmail }).where(eq(conversations.id, conv.id)); }
  if (phoneMatch && !conv.visitorPhone) { conv.visitorPhone = phoneMatch[0]; await db.update(conversations).set({ visitorPhone: conv.visitorPhone }).where(eq(conversations.id, conv.id)); }

  await db.insert(messages).values({ conversationId: conv.id, role: "user", content: body.message }).returning();

  // ALWAYS create/update lead
  var existingLead = await db.query.leads.findFirst({ where: eq(leads.conversationId, conv.id) });
  if (!existingLead) {
    await db.insert(leads).values({ conversationId: conv.id, name: conv.visitorName, email: conv.visitorEmail, phone: conv.visitorPhone, status: "new", serviceInterest: "Chat inquiry" });
    await db.update(conversations).set({ isLead: true }).where(eq(conversations.id, conv.id));
  } else if ((conv.visitorName && !existingLead.name) || (conv.visitorEmail && !existingLead.email)) {
    await db.update(leads).set({ name: existingLead.name || conv.visitorName, email: existingLead.email || conv.visitorEmail, phone: existingLead.phone || conv.visitorPhone }).where(eq(leads.id, existingLead.id));
  }

  // Create ticket once with actual message as description
  var wantsEscalation = body.escalate || /ticket|human|manager|executive|speak to|someone in charge|complaint|complain/i.test(body.message);
  if (wantsEscalation) {
    var existingTicket = await db.query.tickets.findFirst({ where: eq(tickets.conversationId, conv.id) });
    if (!existingTicket) {
      var [ticket] = await db.insert(tickets).values({ ticketNumber: ticketNumber(), conversationId: conv.id, subject: body.message.slice(0, 100), description: body.message, priority: "medium", visitorName: conv.visitorName, visitorEmail: conv.visitorEmail, visitorPhone: conv.visitorPhone }).returning();
      await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
      await db.insert(activityLogs).values({ actor: conv.visitorEmail ?? "visitor", action: "ticket.created", entityType: "ticket", entityId: ticket.id, details: { ticketNumber: ticket.ticketNumber } });
    }
  }

  var past = await db.query.messages.findMany({ where: eq(messages.conversationId, conv.id), orderBy: (m: any, { asc }: any) => asc(m.createdAt), limit: 50 });
  var history = past.map((m: any) => ({ role: m.role, content: m.content }));
  var systemMsg = buildSystemMessage({ name: conv.visitorName, email: conv.visitorEmail, page: conv.sourceUrl });
  var client = (await import("@/lib/ai")).getAiClient();

  var stream = new ReadableStream({
    async start(controller) {
      var enc = new TextEncoder();
      var fullText = "";
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "meta", conversationId: conv.id, publicId: conv.publicId })}\n\n`));
      await client.stream([systemMsg, ...history], {
        onToken: (token: string) => { fullText += token; controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`)); },
        onDone: async (meta: any) => { await db.insert(messages).values({ conversationId: conv.id, role: "assistant", content: fullText, aiGenerated: true, latencyMs: meta.latencyMs }).returning(); await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id)); controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "done", conversationId: conv.id, escalated: wantsEscalation, latencyMs: meta.latencyMs })}\n\n`)); controller.close(); },
        onError: async () => { await db.insert(messages).values({ conversationId: conv.id, role: "assistant", content: "I'm having trouble responding right now.", aiGenerated: false, escalated: true }).returning(); controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", escalated: true })}\n\n`)); controller.close(); },
      });
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}