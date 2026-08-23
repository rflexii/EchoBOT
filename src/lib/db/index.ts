import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Create a Drizzle client backed by Neon (Vercel Postgres).
 *
 * Usage:
 *   import { db } from "@/lib/db";
 *   const rows = await db.select().from(schema.conversations);
 *
 * The connection is created lazily on first use so that importing this module
 * (e.g. during `next build` prerender) never triggers a database connection.
 */

const connectionString = process.env.DATABASE_URL;

export type DB = NeonHttpDatabase<typeof schema>;

declare global {
  // eslint-disable-next-line no-var
  var __ramatDb: DB | undefined;
  // eslint-disable-next-line no-var
  var __ramatSql: NeonQueryFunction<false, false> | undefined;
}

function buildClient(): DB {
  if (!connectionString) {
    throw new Error(
      "[db] DATABASE_URL is not set. Configure Vercel Postgres and set DATABASE_URL in your environment."
    );
  }
  const sql = globalThis.__ramatSql ?? (globalThis.__ramatSql = neon(connectionString));
  return drizzle(sql, { schema });
}

// Proxy that defers creating the real client until a property is actually accessed.
// This keeps `next build` fast and avoids connecting during static prerender.
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    const real = globalThis.__ramatDb ?? (globalThis.__ramatDb = buildClient());
    return (real as any)[prop];
  },
});

export { schema };
