import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE, isAdminEmail } from "@/lib/auth";

/** GET /api/admin/session */
export async function GET() {
  const store = await cookies();
  const raw = store.get(AUTH_COOKIE)?.value;
  if (!raw) return NextResponse.json({ authenticated: false }, { status: 401 });
  const decoded = Buffer.from(raw, "base64").toString("utf8");
  const [email, secret] = decoded.split(":");
  if (!email || !isAdminEmail(email)) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  if (secret !== (process.env.AUTH_SECRET ?? "dev-secret")) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, email });
}
