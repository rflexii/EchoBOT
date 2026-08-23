import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { conversations, leads, activityLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const leadSchema = z.object({
  conversationId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  serviceInterest: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

/** POST /api/leads — create a sales lead. */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof leadSchema>;
  try {
    body = leadSchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid request", details: String(e) }, { status: 400 });
  }

  const [lead] = await db
    .insert(leads)
    .values({
      conversationId: body.conversationId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      serviceInterest: body.serviceInterest,
      budget: body.budget,
      notes: body.notes,
    })
    .returning();

  if (body.conversationId) {
    await db.update(conversations).set({ isLead: true }).where(eq(conversations.id, body.conversationId));
  }

  await db.insert(activityLogs).values({
    actor: body.email ?? "visitor",
    action: "lead.created",
    entityType: "lead",
    entityId: lead.id,
    details: {},
  });

  return NextResponse.json({ lead });
}

/** GET /api/leads — list leads (admin). */
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const all = await db.query.leads.findMany({
    where: status ? (l, { eq }) => eq(l.status, status as any) : undefined,
    orderBy: (l, { desc }) => desc(l.createdAt),
    limit: 100,
  });
  return NextResponse.json({ leads: all });
}
