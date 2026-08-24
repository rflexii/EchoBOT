import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tickets, conversations } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
    const conv = await db.query.conversations.findFirst({ where: eq(conversations.id, body.conversationId) });
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    const [ticket] = await db.insert(tickets).values({
      ticketNumber: new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000),
      conversationId: conv.id,
      subject: body.subject || "Support request",
      description: body.description || "",
      priority: body.priority || "medium",
      assignedTo: body.assignedTo,
      visitorName: body.visitor?.name ?? conv.visitorName,
      visitorEmail: body.visitor?.email ?? conv.visitorEmail,
      visitorPhone: body.visitor?.phone ?? conv.visitorPhone,
    }).returning();
    await db.update(conversations).set({ escalated: true }).where(eq(conversations.id, conv.id));
    return NextResponse.json({ ticket });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const all = await db.query.tickets.findMany({
      where: status ? eq(tickets.status, status as any) : undefined,
      orderBy: (t: any, { desc }: any) => desc(t.createdAt),
      limit: 100,
    });
    return NextResponse.json({ tickets: all || [] });
  } catch (e: any) { return NextResponse.json({ tickets: [], error: String(e?.message ?? e) }, { status: 200 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 });
    const [updated] = await db.update(tickets).set({ ...updates, updatedAt: new Date() }).where(eq(tickets.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ticket: updated });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}