import { getSchoolDb } from "./school-db";
import { UserRole } from "./prisma-school";
import { HR_CREATABLE_PRISMA_ROLES } from "./staff-roles";
import type { SessionUser } from "./session";

export async function provisionUserProfiles(
  schoolCode: string,
  userId: string,
  role: UserRole,
  options?: { gradeBand?: string; grade?: string }
) {
  const db = getSchoolDb(schoolCode);

  if (role === UserRole.TEACHER) {
    await db.teacherProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
  if (role === UserRole.STUDENT) {
    await db.studentProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        gradeBand: options?.gradeBand || "PRIMARY",
        grade: options?.grade || "1",
        status: "ACTIVE",
      },
    });
  }
  if (role === UserRole.PARENT) {
    await db.parentProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
  if (role === UserRole.SCHOOL_ASSISTANT) {
    await db.schoolAssistantProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
  const staffLike: UserRole[] = [
    UserRole.HR,
    ...HR_CREATABLE_PRISMA_ROLES.filter(
      (r) => r !== UserRole.SCHOOL_ASSISTANT && r !== UserRole.TEACHER
    ),
    UserRole.DIRECTOR,
    UserRole.SCHOOL_ADMIN,
  ];
  if (staffLike.includes(role)) {
    await db.staffProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
}

export function auditUserCreateFields(actor: SessionUser) {
  return {
    createdById: actor.id,
    createdByEmail: actor.email,
    updatedById: actor.id,
    updatedByEmail: actor.email,
  };
}
