import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 });
    const result = await db.execute(sql`SELECT id, ticket_number AS "ticketNumber", subject, description, status, priority, visitor_name AS "visitorName", visitor_email AS "visitorEmail", visitor_phone AS "visitorPhone", assigned_to AS "assignedTo", created_at AS "createdAt", updated_at AS "updatedAt" FROM tickets WHERE id = ${id}`);
    if (!result.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ticket: result.rows[0] });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 });
    const [updated] = (await db.execute(sql`UPDATE tickets SET status = ${body.status || "open"}, updated_at = NOW() WHERE id = ${id} RETURNING id, ticket_number AS "ticketNumber", subject, status, priority, visitor_name AS "visitorName", created_at AS "createdAt"`)).rows;
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ticket: updated });
  } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}