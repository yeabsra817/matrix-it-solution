import { masterDb } from "./master-db";
import { getSchoolDb } from "./school-db";
import { verifyPassword, hashPassword } from "./password";
import {
  DEFAULT_PASSWORD,
  MAX_LOGIN_ATTEMPTS,
  ROLE_HOME,
  SCHOOL_HOME_PATH,
  SUPER_ADMIN_VERIFY_CODE,
  type Role,
} from "./constants";
import type { SessionUser } from "./session";
import { validateSchoolForLogin } from "./school-auth";
import { isSuperAdminSchoolCode } from "./super-admin-code";
import {
  findSchoolUserByIdentifier,
  findSuperAdminByIdentifier,
} from "./login-identifier";
export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export async function login(
  schoolCode: string,
  identifier: string,
  password: string,
  verifyCode?: string
): Promise<LoginResult> {
  const loginId = identifier.trim();
  const normalizedEmail = loginId.toLowerCase();
  const code = schoolCode.trim().toUpperCase();

  const globalBlock =
    (await masterDb.globalUserBlock.findUnique({
      where: {
        email: normalizedEmail.includes("@") ? normalizedEmail : `${normalizedEmail}@`,
      },
    })) ??
    (!normalizedEmail.includes("@")
      ? await masterDb.globalUserBlock.findFirst({
          where: { email: { startsWith: `${normalizedEmail}@` } },
        })
      : null);
  if (globalBlock) {
    return { ok: false, error: "Account blocked globally by Super Admin." };
  }

  if (isSuperAdminSchoolCode(code)) {
    if (!verifyCode?.trim() || verifyCode.trim() !== SUPER_ADMIN_VERIFY_CODE) {
      return { ok: false, error: "Super Admin verification code required." };
    }
    const admin = await findSuperAdminByIdentifier(masterDb, loginId);
    if (!admin) return { ok: false, error: "Invalid credentials." };
    if (admin.blockedAt) {
      return { ok: false, error: "Super Admin account is blocked." };
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      const attempts = admin.failedAttempts + 1;
      await masterDb.superAdmin.update({
        where: { id: admin.id },
        data: {
          failedAttempts: attempts,
          blockedAt: attempts >= MAX_LOGIN_ATTEMPTS ? new Date() : null,
        },
      });
      return {
        ok: false,
        error:
          attempts >= MAX_LOGIN_ATTEMPTS
            ? "Account blocked after 3 failed attempts."
            : "Invalid credentials.",
      };
    }

    await masterDb.superAdmin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, blockedAt: null },
    });

    return {
      ok: true,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: "Super Admin",
        role: "SUPER_ADMIN",
        schoolCode: null,
      },
    };
  }

  const schoolCheck = await validateSchoolForLogin(code);
  if (!schoolCheck.ok) {
    return { ok: false, error: schoolCheck.error };
  }

  const db = getSchoolDb(schoolCheck.code);
  const user = await findSchoolUserByIdentifier(db, loginId);
  if (!user) return { ok: false, error: "Invalid credentials." };
  if (user.blockedAt) {
    return { ok: false, error: "Account blocked after 3 failed attempts." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedAttempts + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: attempts,
        blockedAt: attempts >= MAX_LOGIN_ATTEMPTS ? new Date() : null,
      },
    });
    return {
      ok: false,
      error:
        attempts >= MAX_LOGIN_ATTEMPTS
          ? "Account blocked after 3 failed attempts."
          : "Invalid credentials.",
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, blockedAt: null },
  });

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as Role,
      schoolCode: schoolCheck.code,
      schoolName: schoolCheck.name,
      mustChangePwd: user.mustChangePwd,
    },
  };
}

export function redirectPath(user: Pick<SessionUser, "role" | "mustChangePwd">): string {
  if (user.mustChangePwd && user.role !== "SUPER_ADMIN") {
    return "/change-password";
  }
  if (user.role !== "SUPER_ADMIN") {
    return SCHOOL_HOME_PATH;
  }
  return ROLE_HOME[user.role];
}

export async function changePassword(
  session: SessionUser,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (session.role === "SUPER_ADMIN") {
    const admin = await masterDb.superAdmin.findUnique({
      where: { id: session.id },
    });
    if (!admin) return { ok: false, error: "User not found." };
    if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
      return { ok: false, error: "Current password incorrect." };
    }
    await masterDb.superAdmin.update({
      where: { id: admin.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    return { ok: true };
  }

  if (!session.schoolCode) return { ok: false, error: "No school context." };
  const db = getSchoolDb(session.schoolCode);
  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) return { ok: false, error: "User not found." };
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { ok: false, error: "Current password incorrect." };
  }
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePwd: false,
    },
  });
  return { ok: true };
}

export async function resetSchoolUserPassword(
  schoolCode: string,
  userId: string
): Promise<void> {
  const db = getSchoolDb(schoolCode);
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(DEFAULT_PASSWORD),
      mustChangePwd: true,
      failedAttempts: 0,
      blockedAt: null,
    },
  });
}

