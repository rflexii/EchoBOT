import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tickets } from "@/lib/db/schema";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });
    const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, id) });
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const responses = Array.isArray(ticket.responses) ? [...ticket.responses, { role: "admin", message, createdAt: new Date().toISOString() }] : [{ role: "admin", message, createdAt: new Date().toISOString() }];
    await db.update(tickets).set({ responses, updatedAt: new Date() }).where(eq(tickets.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}