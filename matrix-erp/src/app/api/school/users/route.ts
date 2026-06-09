import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { schoolRoleFromString } from "@/lib/roles";
import { hashPassword } from "@/lib/password";
import { DEFAULT_PASSWORD } from "@/lib/constants";
import { canCreateUser } from "@/lib/rbac";
import type { Role } from "@/lib/constants";
import { logFromSession } from "@/lib/audit";
import { buildCommandKey, isDuplicateCommand } from "@/lib/duplicate-guard";
import { auditUserCreateFields, provisionUserProfiles } from "@/lib/user-provision";
import {
  canListUsers,
  userListWhere,
  type UserListScope,
} from "@/lib/user-list-access";

const schema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  role: z.string(),
  gradeBand: z.string().optional(),
  grade: z.string().optional(),
});

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const targetRole = parsed.data.role.toUpperCase() as Role;
  if (!canCreateUser(session!, targetRole)) {
    return NextResponse.json(
      { error: `Forbidden — ${session!.role} cannot create ${targetRole}.` },
      { status: 403 }
    );
  }

  const cmdKey = buildCommandKey({
    action: "user_create",
    school: session!.schoolCode,
    email: parsed.data.email.toLowerCase(),
    role: targetRole,
    actor: session!.id,
  });
  if (isDuplicateCommand(cmdKey)) {
    return NextResponse.json(
      { error: "Duplicate request ignored. User creation already submitted." },
      { status: 409 }
    );
  }

  const role = schoolRoleFromString(targetRole);
  if (!role) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const db = getSchoolDb(session!.schoolCode);
  const existing = await db.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    return NextResponse.json({ error: "User already exists in this school." }, { status: 409 });
  }

  const pwd = await hashPassword(DEFAULT_PASSWORD);
  const user = await db.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      fullName: parsed.data.fullName,
      role,
      passwordHash: pwd,
      mustChangePwd: true,
      ...auditUserCreateFields(session!),
    },
  });

  await provisionUserProfiles(session!.schoolCode, user.id, role, {
    gradeBand: parsed.data.gradeBand,
    grade: parsed.data.grade,
  });

  await logFromSession(
    session!,
    "USER_CREATE",
    "User",
    user.id,
    JSON.stringify({
      roleAssigned: targetRole,
      schoolId: session!.schoolCode,
      createdBy: session!.email,
      timestamp: new Date().toISOString(),
    })
  );

  return NextResponse.json({ ok: true, userId: user.id });
}

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }

  const scopeParam = new URL(req.url).searchParams.get("scope");
  const scope: UserListScope =
    scopeParam === "staff" ||
    scopeParam === "students" ||
    scopeParam === "parents"
      ? scopeParam
      : session!.role === "HR"
        ? "staff"
        : "all";

  if (!canListUsers(session!, scope)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getSchoolDb(session!.schoolCode);
  const where = userListWhere(scope);

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      blockedAt: true,
      mustChangePwd: true,
      createdByEmail: true,
      updatedAt: true,
      studentProfile: { select: { status: true, grade: true, gradeBand: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ users, syncedAt: new Date().toISOString() });
}
