/**
 * Verifies demo fallback login for all production roles.
 */
import { attemptDemoFallbackLogin } from "../src/lib/demo-fallback-auth";

const CASES = [
  { school: "ROOT", email: "yeabsra45@gmail.com", password: "227387", verify: "227387", role: "SUPER_ADMIN" },
  { school: "001", email: "director@001.edu", password: "1234", role: "DIRECTOR" },
  { school: "001", email: "hr@001.edu", password: "1234", role: "HR" },
  { school: "001", email: "teacher@001.edu", password: "1234", role: "TEACHER" },
  { school: "001", email: "student@001.edu", password: "1234", role: "STUDENT" },
];

let passed = 0;
for (const c of CASES) {
  const result = attemptDemoFallbackLogin({
    schoolCode: c.school,
    email: c.email,
    password: c.password,
    verifyCode: c.verify,
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
