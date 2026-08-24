import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
    const conv = await db.execute(sql`SELECT * FROM conversations WHERE id = ${body.conversationId}`);
    if (!conv.rows.length) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    const [ticket] = (await db.execute(sql`INSERT INTO tickets (ticket_number, conversation_id, subject, description, priority, visitor_name, visitor_email, visitor_phone) VALUES (${new Date().getFullYear() + "-" + Math.floor(10000 + Math.random() * 90000)}, ${body.conversationId}, ${body.subject || "Support request"}, ${body.description || ""}, ${body.priority || "medium"}, ${body.visitor?.name || conv.rows[0].visitor_name}, ${body.visitor?.email || conv.rows[0].visitor_email}, ${body.visitor?.phone || conv.rows[0].visitor_phone}) RETURNING *`)).rows;
    await db.execute(sql`UPDATE conversations SET escalated = true WHERE id = ${body.conversationId}`);
    return NextResponse.json({ ticket });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status");
    const result = status
      ? await db.execute(sql`SELECT * FROM tickets WHERE status = ${status} ORDER BY created_at DESC LIMIT 100`)
      : await db.execute(sql`SELECT * FROM tickets ORDER BY created_at DESC LIMIT 100`);
    return NextResponse.json({ tickets: result.rows || [] });
  } catch (e: any) { return NextResponse.json({ tickets: [], error: String(e?.message ?? e) }, { status: 200 }); }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Id required" }, { status: 400 });
    const [updated] = (await db.execute(sql`UPDATE tickets SET status = ${body.status}, updated_at = NOW() WHERE id = ${body.id} RETURNING *`)).rows;
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ticket: updated });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}