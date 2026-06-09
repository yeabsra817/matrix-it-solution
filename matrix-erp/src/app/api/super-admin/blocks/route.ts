import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";

const schema = z.object({
  email: z.string().email(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  const { response } = await requirePermission("manageGlobalBlocks");
  if (response) return response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await masterDb.globalUserBlock.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: { reason: parsed.data.reason },
    create: {
      email: parsed.data.email.toLowerCase(),
      reason: parsed.data.reason,
    },
  });

  return NextResponse.json({ ok: true });
}
