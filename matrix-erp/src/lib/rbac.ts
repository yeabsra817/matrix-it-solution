import type { Role } from "./constants";
import { PLATFORM_ADMIN_ROLES, ROLE_DASHBOARD_SLUG } from "./constants";
import type { SessionUser } from "./session";

/** Strict creation map — server-side only (never trust client). */
export const CREATABLE_BY_ROLE: Partial<Record<Role, readonly Role[]>> = {
  SUPER_ADMIN: ["SCHOOL_ADMIN", "DIRECTOR"],
  SCHOOL_ADMIN: ["HR"],
  HR: [
    "TEACHER",
    "ACCOUNTANT",
    "LIBRARIAN",
    "RECEPTIONIST",
    "SECURITY",
    "NURSE",
    "STAFF",
    "SCHOOL_ASSISTANT",
    "IT_SUPPORT",
    "TRANSPORT_OFFICER",
    "CLEANER",
    "STORE_MANAGER",
    "PURCHASER",
  ],
  SCHOOL_ASSISTANT: ["STUDENT", "PARENT"],
};

export const PERMISSIONS = {
  createSchool: ["SUPER_ADMIN"] as Role[],
  deleteSchool: ["SUPER_ADMIN"] as Role[],
  manageGlobalBlocks: ["SUPER_ADMIN"] as Role[],
  approveRoles: ["SUPER_ADMIN"] as Role[],
  manageSubscriptions: ["SUPER_ADMIN"] as Role[],
  globalAnalytics: ["SUPER_ADMIN"] as Role[],
  createPlatformSchoolUsers: ["SUPER_ADMIN"] as Role[],
  requestRoles: ["DIRECTOR"] as Role[],
  suggestRoles: ["HR"] as Role[],
  manageSchoolSettings: ["SCHOOL_ADMIN"] as Role[],
  manageSchoolOps: ["DIRECTOR", "SCHOOL_ADMIN"] as Role[],
  manageClasses: ["SCHOOL_ADMIN", "DIRECTOR"] as Role[],
  viewSchoolAnalytics: ["DIRECTOR", "SCHOOL_ADMIN", "SUPER_ADMIN"] as Role[],
  hrExperience: ["HR", "DIRECTOR"] as Role[],
  blockSchoolUsers: ["HR", "SCHOOL_ADMIN"] as Role[],
  exportStaff: ["HR", "SCHOOL_ADMIN", "DIRECTOR"] as Role[],
  reviewLeave: ["HR", "DIRECTOR", "SCHOOL_ADMIN"] as Role[],
  registerStudents: ["SCHOOL_ASSISTANT"] as Role[],
  linkParents: ["SCHOOL_ASSISTANT", "SCHOOL_ADMIN"] as Role[],
  resetPasswordGlobal: ["SUPER_ADMIN"] as Role[],
  resetPasswordLocal: ["SCHOOL_ADMIN"] as Role[],
  submitTeacherEvaluation: ["STUDENT", "PARENT", "HR"] as Role[],
  approveKpiStructure: ["DIRECTOR"] as Role[],
  manageGrades: ["TEACHER"] as Role[],
  manageAttendance: ["TEACHER"] as Role[],
  manageFinance: ["ACCOUNTANT"] as Role[],
  manageLibrary: ["LIBRARIAN"] as Role[],
  manageReception: ["RECEPTIONIST"] as Role[],
  manageSecurityLogs: ["SECURITY"] as Role[],
  manageHealth: ["NURSE"] as Role[],
  manageItSupport: ["IT_SUPPORT"] as Role[],
  manageTransport: ["TRANSPORT_OFFICER"] as Role[],
  manageAssets: ["STORE_MANAGER", "DIRECTOR", "SCHOOL_ADMIN"] as Role[],
  manageStore: ["STORE_MANAGER", "DIRECTOR"] as Role[],
  createPurchases: ["PURCHASER"] as Role[],
  approvePurchases: ["DIRECTOR"] as Role[],
  manageKpi: ["HR"] as Role[],
  approveKpi: ["DIRECTOR"] as Role[],
  assessStaff: ["HR"] as Role[],
  createLessonPlan: ["TEACHER"] as Role[],
  approveLessonPlan: ["DIRECTOR"] as Role[],
  manageItSystem: ["SCHOOL_ADMIN"] as Role[],
  viewTeacherKpi: ["TEACHER", "DIRECTOR", "HR"] as Role[],
  viewChildData: ["PARENT"] as Role[],
  viewOwnAcademics: ["STUDENT"] as Role[],
};

export function getCreatableRoles(actor: SessionUser): Role[] {
  if (actor.role === "SUPER_ADMIN") {
    return [...(CREATABLE_BY_ROLE.SUPER_ADMIN ?? [])];
  }
  if (!actor.schoolCode) return [];
  return [...(CREATABLE_BY_ROLE[actor.role] ?? [])];
}

export function canCreateUser(actor: SessionUser, targetRole: Role | string): boolean {
  const target = targetRole as Role;
  if (PLATFORM_ADMIN_ROLES.includes(target as (typeof PLATFORM_ADMIN_ROLES)[number])) {
    if (target === "SUPER_ADMIN") return false;
    return actor.role === "SUPER_ADMIN";
  }
  return getCreatableRoles(actor).includes(target);
}

/** @deprecated Use canCreateUser */
export function canCreateRole(actor: SessionUser, targetRole: string): boolean {
  return canCreateUser(actor, targetRole as Role);
}

export function canManageRole(actor: SessionUser, targetRole: Role): boolean {
  if (actor.role === "SUPER_ADMIN") return true;
  if (["SUPER_ADMIN", "DIRECTOR", "SCHOOL_ADMIN"].includes(targetRole)) {
    return false;
  }
  if (actor.role === "SCHOOL_ADMIN") {
    return targetRole === "HR";
  }
  if (actor.role === "HR") {
    return (CREATABLE_BY_ROLE.HR ?? []).includes(targetRole);
  }
  if (actor.role === "DIRECTOR") {
    return hasPermission(actor, "blockSchoolUsers");
  }
  return false;
}

export function hasPermission(user: SessionUser, key: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[key].includes(user.role);
}

export function canAccessRoute(user: SessionUser, allowed: Role[]): boolean {
  return allowed.includes(user.role);
}

export function assertSchoolScope(user: SessionUser, schoolCode: string): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return user.schoolCode === schoolCode.padStart(3, "0");
}

export function dashboardPathForRole(role: Role): string {
  return ROLE_DASHBOARD_SLUG[role]
    ? `/dashboard/${ROLE_DASHBOARD_SLUG[role]}`
    : "/login";
}

export function roleFromDashboardSegment(segment: string): Role | null {
  const entry = Object.entries(ROLE_DASHBOARD_SLUG).find(([, slug]) => slug === segment);
  return entry ? (entry[0] as Role) : null;
}
