import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/conversations -> list recent conversations with last message. */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const convos = await db.query.conversations.findMany({
    orderBy: (c, { desc }) => desc(c.lastMessageAt),
    limit,
    with: {
      messages: {
        orderBy: (m, { asc }) => asc(m.createdAt),
        limit: 1,
      },
    },
  });

  return NextResponse.json({ conversations: convos });
}
