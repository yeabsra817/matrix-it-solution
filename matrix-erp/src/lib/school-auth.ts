import { masterDb } from "./master-db";
import { SUPER_ADMIN_SCHOOL_CODE } from "./constants";
import { isValidSchoolCodeFormat } from "./school-codes";

export const SCHOOL_NOT_FOUND_ERROR = "Validation Error: School Not Found";
export const SCHOOL_DISABLED_ERROR = "Validation Error: School Disabled";
export const INVALID_SCHOOL_CODE_FORMAT =
  "Validation Error: School code must be exactly 3 digits (001, 002, 003...)";

export type SchoolValidationResult =
  | { ok: true; code: string; name: string }
  | { ok: false; error: string };

export async function validateSchoolForLogin(
  rawCode: string
): Promise<SchoolValidationResult> {
  const code = rawCode.trim().toUpperCase();

  if (!code) {
    return { ok: false, error: SCHOOL_NOT_FOUND_ERROR };
  }

  if (code === SUPER_ADMIN_SCHOOL_CODE || code === "000") {
    return { ok: true, code: SUPER_ADMIN_SCHOOL_CODE, name: "Global Super Admin" };
  }

  if (!isValidSchoolCodeFormat(code.padStart(3, "0"))) {
    return { ok: false, error: INVALID_SCHOOL_CODE_FORMAT };
  }

  const normalized = code.padStart(3, "0");
  const school = await masterDb.school.findUnique({ where: { code: normalized } });

  if (!school) {
    return { ok: false, error: SCHOOL_NOT_FOUND_ERROR };
  }

  if (!school.isActive) {
    return { ok: false, error: SCHOOL_DISABLED_ERROR };
  }

  return { ok: true, code: school.code, name: school.name };
}
