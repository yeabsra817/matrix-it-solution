import { UserRole } from "./prisma-school";

/** Non-student/parent school staff (for listings & HR scope). */
export const STAFF_ROLES: UserRole[] = [
  UserRole.DIRECTOR,
  UserRole.SCHOOL_ADMIN,
  UserRole.HR,
  UserRole.SCHOOL_ASSISTANT,
  UserRole.TEACHER,
  UserRole.ACCOUNTANT,
  UserRole.LIBRARIAN,
  UserRole.RECEPTIONIST,
  UserRole.SECURITY,
  UserRole.NURSE,
  UserRole.STAFF,
  UserRole.IT_SUPPORT,
  UserRole.TRANSPORT_OFFICER,
  UserRole.CLEANER,
  UserRole.STORE_MANAGER,
  UserRole.PURCHASER,
];

export const HR_CREATABLE_PRISMA_ROLES: UserRole[] = [
  UserRole.TEACHER,
  UserRole.ACCOUNTANT,
  UserRole.LIBRARIAN,
  UserRole.RECEPTIONIST,
  UserRole.SECURITY,
  UserRole.NURSE,
  UserRole.STAFF,
  UserRole.SCHOOL_ASSISTANT,
  UserRole.IT_SUPPORT,
  UserRole.TRANSPORT_OFFICER,
  UserRole.CLEANER,
  UserRole.STORE_MANAGER,
  UserRole.PURCHASER,
];

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}
