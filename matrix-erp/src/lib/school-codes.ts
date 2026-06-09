import { masterDb } from "./master-db";

const CODE_PATTERN = /^\d{3}$/;

export function isValidSchoolCodeFormat(code: string): boolean {
  return CODE_PATTERN.test(code);
}

/** Next code: lowest available from 001 upward (no gaps, no letters, 3 digits only). */
export async function getNextSchoolCode(): Promise<
  { ok: true; code: string } | { ok: false; error: string }
> {
  const schools = await masterDb.school.findMany({
    select: { code: true },
    orderBy: { code: "asc" },
  });

  for (const s of schools) {
    if (!isValidSchoolCodeFormat(s.code)) {
      return {
        ok: false,
        error: `Invalid school code "${s.code}". Only 3-digit numbers (001–999) are allowed.`,
      };
    }
  }

  const used = new Set(schools.map((s) => parseInt(s.code, 10)));
  let next = 1;
  while (used.has(next)) {
    next += 1;
    if (next > 999) {
      return { ok: false, error: "Maximum school capacity reached (999 schools)." };
    }
  }

  return { ok: true, code: String(next).padStart(3, "0") };
}

export function assertSequentialCodes(codes: string[]): boolean {
  if (!codes.length) return true;
  const nums = codes
    .filter(isValidSchoolCodeFormat)
    .map((c) => parseInt(c, 10))
    .sort((a, b) => a - b);
  if (nums.length !== codes.length) return false;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== i + 1) return false;
  }
  return true;
}
