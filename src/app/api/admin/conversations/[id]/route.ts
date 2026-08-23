import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { conversations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin";

/** GET /api/admin/conversations/:id -> full conversation with messages, tickets, leads. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const convo = await db.query.conversations.findFirst({
    where: (c, { eq }) => eq(c.id, id),
    with: {
      messages: {
        orderBy: (m, { asc }) => asc(m.createdAt),
      },
      tickets: true,
      leads: true,
    },
  });

  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ conversation: convo });
}
