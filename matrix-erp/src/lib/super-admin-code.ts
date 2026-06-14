import { SUPER_ADMIN_SCHOOL_CODE } from "./constants";

/** True when the login school code is Super Admin (ROOT or legacy 000). */
export function isSuperAdminSchoolCode(raw: string): boolean {
  const code = raw.trim().toUpperCase();
  return code === SUPER_ADMIN_SCHOOL_CODE || code === "000";
}
