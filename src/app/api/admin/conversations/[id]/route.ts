import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { conversations } from "@/lib/db/schema";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Id required" }, { status: 400 });
    const convo = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
      with: {
        messages: { orderBy: (m: any, { asc }: any) => asc(m.createdAt) },
        tickets: true,
        leads: true,
      },
    });
    if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ conversation: convo });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}