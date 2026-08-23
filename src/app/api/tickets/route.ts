import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { conversations, tickets, activityLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ticketNumber } from "@/lib/utils";

const ticketSchema = z.object({
  conversationId: z.string(),
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  visitor: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

/** POST /api/tickets — create a support ticket (escalation). */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof ticketSchema>;
  try {
    body = ticketSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid request", details: String(e) }, { status: 400 });
  }

  const conv = await db.query.conversations.findFirst({
    where: (c, { eq }) => eq(c.id, body.conversationId),
  });
  if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const [ticket] = await db
    .insert(tickets)
    .values({
      ticketNumber: ticketNumber(),
      conversationId: conv.id,
      subject: body.subject,
      description: body.description,
      priority: body.priority ?? "medium",
      visitorName: body.visitor?.name ?? conv.visitorName,
      visitorEmail: body.visitor?.email ?? conv.visitorEmail,
      visitorPhone: body.visitor?.phone ?? conv.visitorPhone,
    })
    .returning();

  await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
  await db.insert(activityLogs).values({
    actor: body.visitor?.email ?? "visitor",
    action: "ticket.created",
    entityType: "ticket",
    entityId: ticket.id,
    details: { ticketNumber: ticket.ticketNumber, priority: ticket.priority },
  });

  return NextResponse.json({ ticket });
}

/** GET /api/tickets — list tickets (admin). */
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const all = await db.query.tickets.findMany({
    where: status ? eq(tickets.status, status as any) : undefined,
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit: 100,
  });
  return NextResponse.json({ tickets: all });
}
