import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { canManageRole, hasPermission } from "@/lib/rbac";
import type { Role } from "@/lib/constants";
import { logFromSession } from "@/lib/audit";

const schema = z.object({
  userId: z.string(),
  action: z.enum(["block", "unblock", "activate"]),
});

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!hasPermission(session!, "blockSchoolUsers")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const user = await db.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.id === session!.id) {
    return NextResponse.json({ error: "Cannot modify your own account." }, { status: 400 });
  }

  if (!canManageRole(session!, user.role as Role)) {
    return NextResponse.json(
      { error: `Forbidden — cannot modify ${user.role} accounts.` },
      { status: 403 }
    );
  }

  const blockedAt =
    parsed.data.action === "block" ? new Date() : null;

  await db.user.update({
    where: { id: parsed.data.userId },
    data: {
      blockedAt,
      failedAttempts: parsed.data.action === "unblock" ? 0 : user.failedAttempts,
    },
  });

  await logFromSession(
    session!,
    `USER_${parsed.data.action.toUpperCase()}`,
    "User",
    user.id,
    user.email
  );

  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
}
