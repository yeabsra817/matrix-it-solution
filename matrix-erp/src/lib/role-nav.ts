import type { Role } from "./constants";

export type NavItem = { href: string; label: string };

/** Role-specific sidebar — unauthorized items hidden per spec. */
export const ROLE_NAV: Partial<Record<Role, NavItem[]>> = {
  DIRECTOR: [
    { href: "/dashboard/director", label: "Overview" },
    { href: "/dashboard/director/pms", label: "PMS Approval" },
    { href: "/dashboard/director/kpi", label: "KPI Approval" },
    { href: "/dashboard/director/lesson-plans", label: "Lesson Plans" },
    { href: "/dashboard/director/purchases", label: "Purchases" },
    { href: "/dashboard/director/assets", label: "Assets" },
    { href: "/dashboard/director/store", label: "Store" },
    { href: "/dashboard/director/reports", label: "Reports" },
    { href: "/dashboard/director/audit", label: "Activity Log" },
    { href: "/dashboard/director/settings", label: "Settings" },
  ],
  SCHOOL_ADMIN: [
    { href: "/dashboard/school-admin", label: "Overview" },
    { href: "/dashboard/school-admin/users", label: "Users" },
    { href: "/dashboard/school-admin/passwords", label: "Block / Reset" },
    { href: "/dashboard/school-admin/settings", label: "IT & System" },
  ],
  HR: [
    { href: "/dashboard/hr", label: "Overview" },
    { href: "/dashboard/hr/staff", label: "All Staff" },
    { href: "/dashboard/hr/kpi", label: "Manage KPI" },
    { href: "/dashboard/hr/create-staff", label: "Create Staff" },
    { href: "/dashboard/hr/leave", label: "Leave" },
    { href: "/dashboard/hr/settings", label: "Settings" },
  ],
  SCHOOL_ASSISTANT: [
    { href: "/dashboard/school-assistant", label: "Overview" },
    { href: "/dashboard/school-assistant/students", label: "Students & Parents" },
    { href: "/dashboard/school-assistant/create", label: "Register User" },
    { href: "/dashboard/school-assistant/settings", label: "Settings" },
  ],
  STORE_MANAGER: [
    { href: "/dashboard/store-manager", label: "Assets" },
    { href: "/dashboard/store-manager/store", label: "Store Orders" },
    { href: "/dashboard/store-manager/settings", label: "Settings" },
  ],
  PURCHASER: [
    { href: "/dashboard/purchaser", label: "Purchase Requests" },
    { href: "/dashboard/purchaser/settings", label: "Settings" },
  ],
  TEACHER: [
    { href: "/dashboard/teacher", label: "My Classes" },
    { href: "/dashboard/teacher/lesson-plan", label: "Lesson Plan" },
    { href: "/dashboard/teacher/marks", label: "Grades" },
    { href: "/dashboard/teacher/attendance", label: "Attendance" },
    { href: "/dashboard/teacher/kpi", label: "KPI & PMS" },
    { href: "/dashboard/teacher/settings", label: "Settings" },
  ],
  ACCOUNTANT: [
    { href: "/dashboard/accountant", label: "Finance" },
    { href: "/dashboard/accountant/budget", label: "Budget" },
    { href: "/dashboard/accountant/settings", label: "Settings" },
  ],
  STUDENT: [
    { href: "/dashboard/student", label: "Overview" },
    { href: "/dashboard/student/marks", label: "Grades" },
    { href: "/dashboard/student/evaluate", label: "Rate Teacher" },
    { href: "/dashboard/student/settings", label: "Settings" },
  ],
  PARENT: [
    { href: "/dashboard/parent", label: "Overview" },
    { href: "/dashboard/parent/marks", label: "Child Progress" },
    { href: "/dashboard/parent/evaluate", label: "Rate Teacher" },
    { href: "/dashboard/parent/settings", label: "Settings" },
  ],
};

export function getRoleNav(role: Role): NavItem[] {
  return ROLE_NAV[role] ?? [
    { href: `/dashboard/${role.toLowerCase().replace(/_/g, "-")}`, label: "Overview" },
    {
      href: `/dashboard/${role.toLowerCase().replace(/_/g, "-")}/settings`,
      label: "Settings",
    },
  ];
}
