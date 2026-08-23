import bcrypt from "bcryptjs";

/**
 * Lightweight admin auth for the dashboard.
 *
 * Admins are identified by email (must be in ADMIN_EMAILS) and authenticate
 * with a password. Passwords are stored as bcrypt hashes in ADMIN_PASSWORD_HASHES
 * as a JSON map of email -> hash (e.g. {"admin@echosystems.ng":"$2a$10$..."}).
 *
 * For a first rollout this keeps things simple and dependency-free.
 * Upgrade to NextAuth/Clerk if you need SSO, MFA, or org-wide SSO later.
 */

export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const map = getPasswordHashes();
  const hash = map[email.trim().toLowerCase()];
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function getPasswordHashes(): Record<string, string> {
  try {
    return JSON.parse(process.env.ADMIN_PASSWORD_HASHES ?? "{}");
  } catch {
    return {};
  }
}

/** Generate a bcrypt hash for a new admin password (one-time helper). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export const AUTH_COOKIE = "ramat_admin";
