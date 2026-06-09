import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { resetSchoolUserPassword } from "@/lib/auth-service";

const schema = z.object({ userId: z.string() });

export async function POST(req: Request) {
  const { session, response } = await requirePermission("resetPasswordLocal");
  if (response) return response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await resetSchoolUserPassword(session!.schoolCode!, parsed.data.userId);
  return NextResponse.json({ ok: true });
}
