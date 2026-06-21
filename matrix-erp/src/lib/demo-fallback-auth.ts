import type { SessionUser } from "./session";
import { ROLE_HOME, SCHOOL_HOME_PATH } from "./constants";
import { isSuperAdminSchoolCode } from "./super-admin-code";
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_PASSWORD,
  LEGACY_SUPER_ADMIN_EMAIL,
  LEGACY_SUPER_ADMIN_PASSWORD,
} from "./super-admin-defaults";

type DemoAccount = {
  schoolCode: string;
  identifiers: string[];
  password: string;
  user: SessionUser;
};

/** Production-safe credentials — work without database on Vercel. */
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    schoolCode: "ROOT",
    identifiers: [
      DEFAULT_SUPER_ADMIN_EMAIL,
      "admin",
      "superadmin",
      "super admin",
      LEGACY_SUPER_ADMIN_EMAIL,
    ],
    password: DEFAULT_SUPER_ADMIN_PASSWORD,
    user: {
      id: "prod-super-admin",
      email: DEFAULT_SUPER_ADMIN_EMAIL,
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
      schoolCode: null,
    },
  },
  {
    schoolCode: "ROOT",
    identifiers: [LEGACY_SUPER_ADMIN_EMAIL],
    password: LEGACY_SUPER_ADMIN_PASSWORD,
    user: {
      id: "legacy-super-admin",
      email: LEGACY_SUPER_ADMIN_EMAIL,
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
      schoolCode: null,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["director@001.edu", "director"],
    password: "1234",
    user: {
      id: "demo-director",
      email: "director@001.edu",
      fullName: "School Director",
      role: "DIRECTOR",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["hr@001.edu", "hr"],
    password: "1234",
    user: {
      id: "demo-hr",
      email: "hr@001.edu",
      fullName: "HR Manager",
      role: "HR",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["teacher@001.edu", "teacher"],
    password: "1234",
    user: {
      id: "demo-teacher",
      email: "teacher@001.edu",
      fullName: "Demo Teacher",
      role: "TEACHER",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["accountant@001.edu", "finance", "accountant"],
    password: "1234",
    user: {
      id: "demo-accountant",
      email: "accountant@001.edu",
      fullName: "Finance Officer",
      role: "ACCOUNTANT",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["purchaser@001.edu", "purchaser"],
    password: "1234",
    user: {
      id: "demo-purchaser",
      email: "purchaser@001.edu",
      fullName: "Purchaser",
      role: "PURCHASER",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["store@001.edu", "store", "store manager"],
    password: "1234",
    user: {
      id: "demo-store",
      email: "store@001.edu",
      fullName: "Store Manager",
      role: "STORE_MANAGER",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["staff@001.edu", "staff", "academic staff"],
    password: "1234",
    user: {
      id: "demo-staff",
      email: "staff@001.edu",
      fullName: "Academic Staff",
      role: "STAFF",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["librarian@001.edu", "librarian"],
    password: "1234",
    user: {
      id: "demo-librarian",
      email: "librarian@001.edu",
      fullName: "Librarian",
      role: "LIBRARIAN",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["receptionist@001.edu", "receptionist"],
    password: "1234",
    user: {
      id: "demo-receptionist",
      email: "receptionist@001.edu",
      fullName: "Receptionist",
      role: "RECEPTIONIST",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["nurse@001.edu", "nurse"],
    password: "1234",
    user: {
      id: "demo-nurse",
      email: "nurse@001.edu",
      fullName: "School Nurse",
      role: "NURSE",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["it@001.edu", "it", "it support"],
    password: "1234",
    user: {
      id: "demo-it",
      email: "it@001.edu",
      fullName: "IT Support",
      role: "IT_SUPPORT",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["officer@001.edu", "school officer", "school assistant"],
    password: "1234",
    user: {
      id: "demo-officer",
      email: "officer@001.edu",
      fullName: "School Officer",
      role: "SCHOOL_ASSISTANT",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["admin@001.edu", "school admin"],
    password: "1234",
    user: {
      id: "demo-admin",
      email: "admin@001.edu",
      fullName: "School Admin",
      role: "SCHOOL_ADMIN",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["student@001.edu", "student"],
    password: "1234",
    user: {
      id: "demo-student",
      email: "student@001.edu",
      fullName: "Demo Student",
      role: "STUDENT",
      schoolCode: "001",
      schoolName: "Matrix Demo School One",
      mustChangePwd: false,
    },
  },
];

function matchesIdentifier(account: DemoAccount, raw: string): boolean {
  const id = raw.trim().toLowerCase();
  return account.identifiers.some((a) => a.toLowerCase() === id);
}

export function attemptDemoFallbackLogin(params: {
  schoolCode: string;
  email: string;
  password: string;
  verifyCode?: string;
}): { ok: true; user: SessionUser } | { ok: false; error: string } {
  const code = params.schoolCode.trim().toUpperCase();
  const password = params.password;

  for (const account of DEMO_ACCOUNTS) {
    const schoolMatch =
      isSuperAdminSchoolCode(code) && isSuperAdminSchoolCode(account.schoolCode)
        ? true
        : account.schoolCode === code.padStart(3, "0");

    if (!schoolMatch) continue;
    if (!matchesIdentifier(account, params.email)) continue;
    if (password !== account.password) continue;

    return { ok: true, user: { ...account.user } };
  }

  return { ok: false, error: "Invalid credentials." };
}

export function redirectForUser(user: Pick<SessionUser, "role" | "mustChangePwd">): string {
  if (user.mustChangePwd && user.role !== "SUPER_ADMIN") {
    return "/change-password";
  }
  if (user.role !== "SUPER_ADMIN") {
    return SCHOOL_HOME_PATH;
  }
  return ROLE_HOME[user.role];
}

export { DEMO_ACCOUNTS };
