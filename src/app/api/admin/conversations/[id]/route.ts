import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { conversations, messages, tickets, leads } from "@/lib/db/schema";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 });
    const convo = await db.query.conversations.findFirst({ where: eq(conversations.id, id) });
    if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const msgs = await db.query.messages.findMany({ where: eq(messages.conversationId, id), orderBy: (m: any, { asc }: any) => asc(m.createdAt) });
    const tix = await db.query.tickets.findMany({ where: eq(tickets.conversationId, id) });
    const lds = await db.query.leads.findMany({ where: eq(leads.conversationId, id) });
    return NextResponse.json({ conversation: { ...convo, messages: msgs, tickets: tix, leads: lds } });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}