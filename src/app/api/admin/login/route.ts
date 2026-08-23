import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE, isAdminEmail, verifyPassword } from "@/lib/auth";

/**
 * POST /api/admin/login  { email, password } -> sets httpOnly session cookie
 */

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

  if (!isAdminEmail(body.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const valid = await verifyPassword(body.email, body.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET ?? "dev-secret";
  const sessionValue = Buffer.from(`${body.email}:${secret}`).toString("base64");

  const res = NextResponse.json({ ok: true, email: body.email });
  res.cookies.set(AUTH_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
