import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof loginSchema>;
  try {
    body = loginSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Check env-based admins (always works)
  const envAdmins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (envAdmins.includes(body.email.toLowerCase())) {
    try {
      const { verifyPassword } = await import("@/lib/auth");
      const valid = await verifyPassword(body.email, body.password);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      return setSession(body.email);
    } catch {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }

  // Check database admins (only if table exists)
  try {
    const { db } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const { admins } = await import("@/lib/db/schema");
    const { verifyPassword } = await import("@/lib/email");
    const dbAdmin = await db.query.admins.findFirst({ where: eq(admins.email, body.email) });
    if (dbAdmin) {
      const valid = await verifyPassword(body.password, dbAdmin.passwordHash);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      return setSession(body.email);
    }
  } catch {
    // admins table may not exist yet, ignore
  }

  return NextResponse.json({ error: "Not authorized" }, { status: 403 });
}

function setSession(email: string) {
  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  const sessionValue = Buffer.from(`${email}:${secret}`).toString("base64");
  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(AUTH_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}