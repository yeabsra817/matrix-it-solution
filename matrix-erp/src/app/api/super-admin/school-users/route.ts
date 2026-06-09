import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCanCreateUser } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { masterDb } from "@/lib/master-db";
import { schoolRoleFromString } from "@/lib/roles";
import { hashPassword } from "@/lib/password";
import { DEFAULT_PASSWORD } from "@/lib/constants";
import type { Role } from "@/lib/constants";
import { logMasterAudit } from "@/lib/audit";
import { auditUserCreateFields, provisionUserProfiles } from "@/lib/user-provision";
import { buildCommandKey, isDuplicateCommand } from "@/lib/duplicate-guard";

const schema = z.object({
  schoolCode: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.enum(["SCHOOL_ADMIN", "DIRECTOR"]),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const targetRole = parsed.data.role as Role;
  const { session, response } = await requireCanCreateUser(
    targetRole,
    parsed.data.schoolCode
  );
  if (response) return response;

  const code = parsed.data.schoolCode.padStart(3, "0");
  const school = await masterDb.school.findUnique({ where: { code } });
  if (!school || !school.isActive) {
    return NextResponse.json({ error: "School not found or inactive." }, { status: 404 });
  }

  const cmdKey = buildCommandKey({
    action: "super_create_user",
    school: code,
    email: parsed.data.email,
    role: targetRole,
  });
  if (isDuplicateCommand(cmdKey)) {
    return NextResponse.json({ error: "Duplicate request ignored." }, { status: 409 });
  }

  const prismaRole = schoolRoleFromString(targetRole);
  if (!prismaRole) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const db = getSchoolDb(code);
  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "User already exists in this school." }, { status: 409 });
  }

  const pwd = await hashPassword(DEFAULT_PASSWORD);
  const user = await db.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      role: prismaRole,
      passwordHash: pwd,
      mustChangePwd: true,
      ...auditUserCreateFields(session!),
    },
  });

  await provisionUserProfiles(code, user.id, prismaRole);

  await logMasterAudit({
    actorEmail: session!.email,
    actorRole: session!.role,
    schoolCode: code,
    action: "USER_CREATE",
    entity: "User",
    entityId: user.id,
    details: JSON.stringify({
      roleAssigned: targetRole,
      createdBy: session!.email,
      schoolId: code,
    }),
  });

  return NextResponse.json({ ok: true, userId: user.id, schoolCode: code });
}
