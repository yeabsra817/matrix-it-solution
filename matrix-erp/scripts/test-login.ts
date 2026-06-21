import { login } from "../src/lib/auth-service";

const CASES = [
  { code: "001", email: "director@001.edu", password: "1234", role: "DIRECTOR" },
  { code: "001", email: "admin@001.edu", password: "1234", role: "SCHOOL_ADMIN" },
  { code: "001", email: "hr@001.edu", password: "1234", role: "HR" },
  { code: "001", email: "teacher@001.edu", password: "1234", role: "TEACHER" },
  { code: "001", email: "student@001.edu", password: "1234", role: "STUDENT" },
  {
    code: "ROOT",
    email: "admin@matrix.com",
    password: "Admin123!",
    role: "SUPER_ADMIN",
  },
  {
    code: "ROOT",
    email: "yeabsra45@gmail.com",
    password: "227387",
    role: "SUPER_ADMIN",
  },
];

async function main() {
  let passed = 0;
  for (const c of CASES) {
    try {
      const result = await login(c.code, c.email, c.password);
      if (result.ok && result.user.role === c.role) {
        console.log(`✓ ${c.email} (${c.role})`);
        passed++;
      } else {
        console.log(`✗ ${c.email}: ${result.ok ? "wrong role" : result.error}`);
      }
    } catch (e) {
      console.log(`✗ ${c.email}: crash — ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\n${passed}/${CASES.length} login tests passed`);
  process.exit(passed === CASES.length ? 0 : 1);
}

main();
