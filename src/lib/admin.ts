import { NextRequest } from "next/server";
import { AUTH_COOKIE, isAdminEmail } from "@/lib/auth";

/** Guard helper for admin route handlers. */
export async function requireAdmin(req: NextRequest): Promise<{ email: string } | null> {
  const raw = req.cookies.get(AUTH_COOKIE)?.value;
  if (!raw) return null;
  const decoded = Buffer.from(raw, "base64").toString("utf8");
  const [email, secret] = decoded.split(":");
  if (!email || !isAdminEmail(email)) return null;
  if (secret !== (process.env.AUTH_SECRET ?? "dev-secret")) return null;
  return { email };
}
