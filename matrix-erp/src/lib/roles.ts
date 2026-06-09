import { UserRole } from "@/lib/prisma-school";

const STRING_TO_PRISMA: Record<string, UserRole> = {
  DIRECTOR: UserRole.DIRECTOR,
  SCHOOL_ADMIN: UserRole.SCHOOL_ADMIN,
  HR: UserRole.HR,
  SCHOOL_ASSISTANT: UserRole.SCHOOL_ASSISTANT,
  SCHOOL_OFFICER: UserRole.SCHOOL_ASSISTANT,
  TEACHER: UserRole.TEACHER,
  STUDENT: UserRole.STUDENT,
  PARENT: UserRole.PARENT,
  ACCOUNTANT: UserRole.ACCOUNTANT,
  LIBRARIAN: UserRole.LIBRARIAN,
  RECEPTIONIST: UserRole.RECEPTIONIST,
  SECURITY: UserRole.SECURITY,
  NURSE: UserRole.NURSE,
  STAFF: UserRole.STAFF,
  IT_SUPPORT: UserRole.IT_SUPPORT,
  IT_ADMIN: UserRole.IT_SUPPORT,
  TRANSPORT_OFFICER: UserRole.TRANSPORT_OFFICER,
  CLEANER: UserRole.CLEANER,
  STORE_MANAGER: UserRole.STORE_MANAGER,
  PURCHASER: UserRole.PURCHASER,
};

export function schoolRoleFromString(role: string): UserRole | null {
  return STRING_TO_PRISMA[role.trim().toUpperCase()] ?? null;
}

export function prismaRoleToAppRole(role: UserRole): string {
  return role === UserRole.SCHOOL_ASSISTANT ? "SCHOOL_ASSISTANT" : String(role);
}
