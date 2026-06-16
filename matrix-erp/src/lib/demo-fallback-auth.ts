import type { SessionUser } from "./session";
import { ROLE_HOME, SCHOOL_HOME_PATH, SUPER_ADMIN_VERIFY_CODE } from "./constants";
import { isSuperAdminSchoolCode } from "./super-admin-code";

type DemoAccount = {
  schoolCode: string;
  identifiers: string[];
  password: string;
  verifyCode?: string;
  user: SessionUser;
};

/** Bundled demo credentials — used when database is unreachable on serverless. */
const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    schoolCode: "ROOT",
    identifiers: ["yeabsra45@gmail.com", "superadmin", "super admin"],
    password: "227387",
    verifyCode: SUPER_ADMIN_VERIFY_CODE,
    user: {
      id: "demo-super-admin",
      email: "yeabsra45@gmail.com",
      fullName: "Super Admin",
      role: "SUPER_ADMIN",
      schoolCode: null,
    },
  },
  {
    schoolCode: "001",
    identifiers: ["director@001.edu", "director", "school director"],
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
    identifiers: ["hr@001.edu", "hr", "hr manager"],
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
    identifiers: ["teacher@001.edu", "teacher", "demo teacher"],
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
    identifiers: ["admin@001.edu", "admin", "school admin"],
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
    identifiers: ["student@001.edu", "student", "demo student"],
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

    if (account.verifyCode) {
      const verify = params.verifyCode?.trim();
      if (!verify || verify !== account.verifyCode) {
        return { ok: false, error: "Super Admin verification code required." };
      }
    }

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
