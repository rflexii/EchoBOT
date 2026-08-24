import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { admins } from "@/lib/db/schema";
import { hashPassword } from "@/lib/email";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  try { const all = await db.query.admins.findMany({ orderBy: (a: any, { asc }: any) => asc(a.email) }); return NextResponse.json({ admins: all.map((a: any) => ({ id: a.id, email: a.email, name: a.name })) }); } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  try { const { email, password, name } = await req.json(); if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 }); if (await db.query.admins.findFirst({ where: eq(admins.email, email) })) return NextResponse.json({ error: "Already exists" }, { status: 409 }); const [n] = await db.insert(admins).values({ email, passwordHash: await hashPassword(password), name }).returning(); return NextResponse.json({ admin: { id: n.id, email: n.email, name: n.name } }, { status: 201 }); } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}
export async function DELETE(req: NextRequest) {
  try { const { id } = await req.json(); if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 }); await db.delete(admins).where(eq(admins.id, id)); return NextResponse.json({ ok: true }); } catch (e: any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); }
}
