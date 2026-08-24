import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { admins } from "@/lib/db/schema";
import { verifyPassword, hashPassword } from "@/lib/email";
import { requireAdmin } from "@/lib/admin";
export async function PATCH(req: NextRequest) { const a = await requireAdmin(req); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); try { const { name, currentPassword, newPassword } = await req.json(); const ex = await db.query.admins.findFirst({ where: eq(admins.email, a.email) }); if (!ex) return NextResponse.json({ error: "Not found" }, { status: 404 }); const u: any = {}; if (name !== undefined) u.name = name; if (newPassword) { if (!currentPassword || !await verifyPassword(currentPassword, ex.passwordHash)) return NextResponse.json({ error: "Current password incorrect" }, { status: 401 }); u.passwordHash = await hashPassword(newPassword); } const [up] = await db.update(admins).set(u).where(eq(admins.id, ex.id)).returning(); return NextResponse.json({ email: up.email, name: up.name }); } catch (e:any) { return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 }); } }
