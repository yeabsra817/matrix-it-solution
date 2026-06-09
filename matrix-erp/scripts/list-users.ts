import path from "path";
import fs from "fs";
import { PrismaClient as MasterClient } from "../src/lib/prisma-master";
import { PrismaClient as SchoolClient } from "../src/lib/prisma-school";

const DEFAULT_PASSWORD = "1234";

async function listSchoolDb(file: string) {
  const url = `file:${file.replace(/\\/g, "/")}`;
  const db = new SchoolClient({ datasources: { db: { url } } });
  const users = await db.$queryRaw<
    {
      email: string;
      fullName: string;
      role: string;
      mustChangePwd: number;
      blockedAt: string | null;
    }[]
  >`SELECT email, fullName, role, mustChangePwd, blockedAt FROM User ORDER BY role ASC`;
  await db.$disconnect();
  return users;
}

async function main() {
  const masterPath = path.join(process.cwd(), "data", "master.db");
  if (fs.existsSync(masterPath)) {
    const master = new MasterClient();
    const admins = await master.superAdmin.findMany({ select: { email: true, blockedAt: true } });
    console.log("\n=== SUPER ADMIN (school code: ROOT) ===");
    console.log("Password (from seed): 227387");
    for (const a of admins) {
      console.log(`  ${a.email}${a.blockedAt ? " [BLOCKED]" : ""}`);
    }
    await master.$disconnect();
  } else {
    console.log("\n=== SUPER ADMIN ===");
    console.log("master.db not found. Run: npm run seed");
    console.log("Default after seed: yeabsra45@gmail.com / 227387 (school code ROOT)");
  }

  const schoolsDir = path.join(process.cwd(), "data", "schools");
  if (!fs.existsSync(schoolsDir)) {
    console.log("\nNo school databases found.");
    return;
  }

  const files = fs.readdirSync(schoolsDir).filter((f) => f.endsWith(".db"));
  for (const file of files.sort()) {
    const code = file.replace(".db", "");
    const users = await listSchoolDb(path.join(schoolsDir, file));
    console.log(`\n=== SCHOOL ${code.padStart(3, "0")} (${users.length} users) ===`);
    console.log(`Default password for school users (unless changed): ${DEFAULT_PASSWORD}`);
    console.log("(Passwords are hashed in DB — plaintext cannot be recovered.)");
    for (const u of users) {
      const flags = [
        u.mustChangePwd ? "must-change-pwd" : null,
        u.blockedAt ? "BLOCKED" : null,
      ]
        .filter(Boolean)
        .join(", ");
      console.log(`  [${u.role}] ${u.fullName} <${u.email}>${flags ? ` (${flags})` : ""}`);
    }
  }
}

main().catch(console.error);
