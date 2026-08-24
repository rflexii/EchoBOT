import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { conversations, tickets, activityLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ticketNumber } from "@/lib/utils";
import { sendTicketNotification } from "@/lib/email";

const ticketSchema = z.object({
  conversationId: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.string().optional(),
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
  try {
    let body: z.infer<typeof ticketSchema>;
    try {
      body = ticketSchema.parse(await req.json());
    } catch (e) {
      return NextResponse.json({ error: "Invalid request", details: String(e) }, { status: 400 });
    }

    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, body.conversationId),
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
        assignedTo: body.assignedTo,
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

    // Send email notification to assigned executive (fire and forget)
    if (ticket.assignedTo) {
      sendTicketNotification(ticket).catch(() => {});
    }

    return NextResponse.json({ ticket });
  } catch (e: any) {
    console.error("[api/tickets] error:", e);
    return NextResponse.json({ error: "Internal server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}

/** GET /api/tickets — list tickets (admin). */
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const all = await db.query.tickets.findMany({
      where: status ? eq(tickets.status, status as any) : undefined,
      orderBy: (t, { desc }) => desc(t.createdAt),
      limit: 100,
    });
    return NextResponse.json({ tickets: all });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}

/** PATCH /api/tickets — update ticket status/assignment. */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Ticket id required" }, { status: 400 });
    const [updated] = await db.update(tickets).set({ ...updates, updatedAt: new Date() }).where(eq(tickets.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    return NextResponse.json({ ticket: updated });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error", message: String(e?.message ?? e) }, { status: 500 });
  }
}
