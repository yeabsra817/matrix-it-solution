import type { SessionUser } from "./session";
import { UserRole } from "./prisma-school";
import { STAFF_ROLES } from "./staff-roles";

export type UserListScope = "staff" | "students" | "parents" | "all";

export function canListUsers(
  session: SessionUser,
  scope: UserListScope
): boolean {
  const role = session.role;
  if (scope === "staff") {
    return ["HR", "SCHOOL_ADMIN", "DIRECTOR"].includes(role);
  }
  if (scope === "students") {
    return ["HR", "SCHOOL_ADMIN", "DIRECTOR", "SCHOOL_ASSISTANT", "TEACHER"].includes(
      role
    );
  }
  if (scope === "parents") {
    return ["HR", "SCHOOL_ADMIN", "DIRECTOR", "SCHOOL_ASSISTANT"].includes(role);
  }
  return ["HR", "SCHOOL_ADMIN", "DIRECTOR"].includes(role);
}

export function userListWhere(scope: UserListScope) {
  if (scope === "staff") {
    return { role: { in: STAFF_ROLES } };
  }
  if (scope === "students") {
    return { role: UserRole.STUDENT };
  }
  if (scope === "parents") {
    return { role: UserRole.PARENT };
  }
  return undefined;
}
