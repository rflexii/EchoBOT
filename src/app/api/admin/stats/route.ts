import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, messages, tickets, leads, activityLogs } from "@/lib/db/schema";
import { gte, sql, eq, and } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/stats -> dashboard KPIs + series */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [[totalConvos], [totalMsgs], [totalTickets], [totalLeads], [openTickets], [newLeads]] =
    await Promise.all([
      db.select({ c: sql<number>`count(*)` }).from(conversations),
      db.select({ c: sql<number>`count(*)` }).from(messages),
      db.select({ c: sql<number>`count(*)` }).from(tickets),
      db.select({ c: sql<number>`count(*)` }).from(leads),
      db.select({ c: sql<number>`count(*)` }).from(tickets).where(eq(tickets.status, "open")),
      db.select({ c: sql<number>`count(*)` }).from(leads).where(eq(leads.status, "new")),
    ]);

  // Conversations per day (last 30 days)
  const perDay = await db
    .select({
      day: sql<string>`to_char(${conversations.startedAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)`,
    })
    .from(conversations)
    .where(gte(conversations.startedAt, thirtyDaysAgo))
    .groupBy(sql`to_char(${conversations.startedAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${conversations.startedAt}, 'YYYY-MM-DD')`);

  // Ticket breakdown by status
  const ticketsByStatus = await db
    .select({ status: tickets.status, count: sql<number>`count(*)` })
    .from(tickets)
    .groupBy(tickets.status);

  // Lead breakdown by status
  const leadsByStatus = await db
    .select({ status: leads.status, count: sql<number>`count(*)` })
    .from(leads)
    .groupBy(leads.status);

  // Avg latency (assistant messages, last 30 days)
  const [avgLatency] = await db
    .select({ avg: sql<number>`avg(${messages.latencyMs})` })
    .from(messages)
    .where(and(eq(messages.role, "assistant"), gte(messages.createdAt, thirtyDaysAgo)));

  // Escalation rate
  const [[escalatedConvos]] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)` })
      .from(conversations)
      .where(eq(conversations.escalated, true)),
  ]);

  return NextResponse.json({
    totals: {
      conversations: totalConvos.c,
      messages: totalMsgs.c,
      tickets: totalTickets.c,
      leads: totalLeads.c,
      openTickets: openTickets.c,
      newLeads: newLeads.c,
    },
    escalationRate:
      totalConvos.c > 0 ? Math.round((escalatedConvos.c / totalConvos.c) * 100) : 0,
    avgLatencyMs: Math.round(avgLatency?.avg ?? 0),
    perDay,
    ticketsByStatus,
    leadsByStatus,
  });
}
