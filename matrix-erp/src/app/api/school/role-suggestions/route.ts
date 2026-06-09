import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";

const schema = z.object({
  roleName: z.string(),
  userEmail: z.string().email(),
  fullName: z.string().min(2),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, response } = await requirePermission("suggestRoles");
  if (response) return response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const row = await db.roleSuggestion.create({
    data: {
      suggestedBy: session!.email,
      roleName: parsed.data.roleName,
      userEmail: parsed.data.userEmail.toLowerCase(),
      fullName: parsed.data.fullName,
      note: parsed.data.note,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

export async function GET() {
  const { session, response } = await requirePermission("suggestRoles");
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const suggestions = await db.roleSuggestion.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ suggestions });
}
