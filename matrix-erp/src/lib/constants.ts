export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "MATRIX IT SOLUTION";
export const SYSTEM_CREDIT = "Developed by Yeabsra Teffera";
export const FOOTER_DEVELOPER = "Developer: Yeabsra Teffera";
export const FOOTER_SALES_DIRECTOR = "Sales Director: Henok Abebe";
export const FOOTER_PHONE =
  process.env.NEXT_PUBLIC_SALES_PHONE || "Phone: +251-900-000-000";

export const STUDENT_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "TERMINATED",
  "TRANSFERRED",
] as const;

/** Platform + school tenant roles (SUPER_ADMIN is master DB only). */
export const ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "SCHOOL_ADMIN",
  "HR",
  "SCHOOL_ASSISTANT",
  "STORE_MANAGER",
  "PURCHASER",
  "TEACHER",
  "ACCOUNTANT",
  "LIBRARIAN",
  "RECEPTIONIST",
  "SECURITY",
  "NURSE",
  "STAFF",
  "IT_SUPPORT",
  "TRANSPORT_OFFICER",
  "CLEANER",
  "PARENT",
  "STUDENT",
] as const;

export type Role = (typeof ROLES)[number];

export const SCHOOL_ROLES = ROLES.filter((r) => r !== "SUPER_ADMIN");

/** Roles only Super Admin may assign. */
export const PLATFORM_ADMIN_ROLES = ["SUPER_ADMIN", "SCHOOL_ADMIN", "DIRECTOR"] as const;

export const SUBJECTS = ["Math", "English", "Physics", "Economics", "Science"];

export const GRADE_BANDS = {
  KG: ["KG1", "KG2", "KG3"],
  PRIMARY: ["1", "2", "3", "4", "5", "6", "7", "8"],
  SECONDARY: ["9", "10"],
} as const;

export const ALL_GRADES = [
  "KG1", "KG2", "KG3",
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
];

export const MARK_WEIGHTS = {
  assignment: 0.3,
  exam: 0.3,
  final: 0.4,
} as const;

export const PMS_WEIGHTS = {
  HR: 0.5,
  STUDENTS: 0.25,
  PARENTS: 0.25,
} as const;

export const DEFAULT_PASSWORD = "1234";
export const MAX_LOGIN_ATTEMPTS = 3;
export const SUPER_ADMIN_SCHOOL_CODE = "ROOT";
/** Super Admin login verification code (in addition to password). */
export const SUPER_ADMIN_VERIFY_CODE =
  process.env.SUPER_ADMIN_VERIFY_CODE || "227387";
export const CURRENT_PMS_PERIOD = "2025-Q2";
export const SCHOOL_HOME_PATH = "/school-home";

export const ROLE_DASHBOARD_SLUG: Record<Role, string> = {
  SUPER_ADMIN: "super-admin",
  DIRECTOR: "director",
  SCHOOL_ADMIN: "school-admin",
  HR: "hr",
  SCHOOL_ASSISTANT: "school-assistant",
  STORE_MANAGER: "store-manager",
  PURCHASER: "purchaser",
  TEACHER: "teacher",
  ACCOUNTANT: "accountant",
  LIBRARIAN: "librarian",
  RECEPTIONIST: "receptionist",
  SECURITY: "security",
  NURSE: "nurse",
  STAFF: "staff",
  IT_SUPPORT: "it-support",
  TRANSPORT_OFFICER: "transport-officer",
  CLEANER: "cleaner",
  PARENT: "parent",
  STUDENT: "student",
};

export const ROLE_HOME: Record<Role, string> = Object.fromEntries(
  Object.entries(ROLE_DASHBOARD_SLUG).map(([role, slug]) => [
    role,
    role === "SUPER_ADMIN" ? "/super-admin" : `/dashboard/${slug}`,
  ])
) as Record<Role, string>;

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRECTOR: "Director",
  SCHOOL_ADMIN: "School Admin",
  HR: "HR",
  SCHOOL_ASSISTANT: "School Officer",
  STORE_MANAGER: "Store Manager",
  PURCHASER: "Purchaser",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  LIBRARIAN: "Librarian",
  RECEPTIONIST: "Receptionist",
  SECURITY: "Security",
  NURSE: "Nurse",
  STAFF: "Staff",
  IT_SUPPORT: "IT Support",
  TRANSPORT_OFFICER: "Transport Officer",
  CLEANER: "Cleaner",
  PARENT: "Parent",
  STUDENT: "Student",
};
