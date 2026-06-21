/**
 * Verifies demo fallback login for all production roles.
 */
import { attemptDemoFallbackLogin } from "../src/lib/demo-fallback-auth";
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_PASSWORD,
} from "../src/lib/super-admin-defaults";

const CASES = [
  {
    school: "ROOT",
    email: DEFAULT_SUPER_ADMIN_EMAIL,
    password: DEFAULT_SUPER_ADMIN_PASSWORD,
    role: "SUPER_ADMIN",
  },
  { school: "001", email: "director@001.edu", password: "1234", role: "DIRECTOR" },
  { school: "001", email: "hr@001.edu", password: "1234", role: "HR" },
  { school: "001", email: "teacher@001.edu", password: "1234", role: "TEACHER" },
  { school: "001", email: "accountant@001.edu", password: "1234", role: "ACCOUNTANT" },
  { school: "001", email: "purchaser@001.edu", password: "1234", role: "PURCHASER" },
  { school: "001", email: "store@001.edu", password: "1234", role: "STORE_MANAGER" },
  { school: "001", email: "staff@001.edu", password: "1234", role: "STAFF" },
  { school: "001", email: "student@001.edu", password: "1234", role: "STUDENT" },
];

let passed = 0;
for (const c of CASES) {
  const result = attemptDemoFallbackLogin({
    schoolCode: c.school,
    email: c.email,
    password: c.password,
  });
  if (result.ok && result.user.role === c.role) {
    console.log(`✓ ${c.role} (${c.email})`);
    passed++;
  } else {
    console.log(`✗ ${c.role}: ${result.ok ? "wrong role" : result.error}`);
  }
}
console.log(`\n${passed}/${CASES.length} demo auth tests passed`);
process.exit(passed === CASES.length ? 0 : 1);
