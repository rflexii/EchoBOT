import { db } from "./index";

/**
 * Run a function with a fresh DB connection, then close it.
 * Ideal for scripts / migrations run outside the server lifecycle.
 */
export async function withDb<T>(fn: (db: ReturnType<typeof import("drizzle-orm/neon-http").drizzle>) => Promise<T>): Promise<T> {
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL ?? "");
  const client = drizzle(sql, { schema: (await import("./schema")) as any });
  try {
    return await fn(client);
  } finally {
    // neon's sql client exposes .end() to close the connection
    await (sql as any).end?.();
  }
}
