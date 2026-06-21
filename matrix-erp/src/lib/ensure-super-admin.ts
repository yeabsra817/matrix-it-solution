import { hashPassword } from "./password";
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_PASSWORD,
  LEGACY_SUPER_ADMIN_EMAIL,
  LEGACY_SUPER_ADMIN_PASSWORD,
} from "./super-admin-defaults";

/** Ensure default Super Admin accounts exist in master DB (idempotent). */
export async function ensureDefaultSuperAdmins(): Promise<void> {
  try {
    const { getMasterDb } = await import("./master-db");
    const db = getMasterDb();

    await db.homepageTemplate.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        minTitleLength: 3,
        minMessageLength: 10,
        defaultThemeColor: "#2563eb",
        defaultBackgroundStyle: "gradient",
        requiredFields: "title,message,welcome,contact,announcement",
        structureNote: "Schools must keep logo, welcome, announcements, and contact sections.",
      },
    });

    const accounts = [
      { email: DEFAULT_SUPER_ADMIN_EMAIL, password: DEFAULT_SUPER_ADMIN_PASSWORD },
      { email: LEGACY_SUPER_ADMIN_EMAIL, password: LEGACY_SUPER_ADMIN_PASSWORD },
    ];

    for (const acc of accounts) {
      const passwordHash = await hashPassword(acc.password);
      await db.superAdmin.upsert({
        where: { email: acc.email },
        update: { passwordHash, failedAttempts: 0, blockedAt: null },
        create: { email: acc.email, passwordHash },
      });
    }
  } catch (err) {
    console.warn("[ensureDefaultSuperAdmins] skipped:", err);
  }
}
