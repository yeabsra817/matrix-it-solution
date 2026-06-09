import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const MASTER_DB = path.join(process.cwd(), "data", "master.db");
const SCHOOL_001 = path.join(process.cwd(), "data", "schools", "001.db");

/** Fast setup — only runs seed when databases or demo users are missing. */
export async function ensureAppReady(): Promise<void> {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), "data", "schools"), { recursive: true });

  if (!fs.existsSync(MASTER_DB)) {
    console.log("[MATRIX] Setting up Super Admin database...");
    execSync("npm run seed", { stdio: "inherit", cwd: process.cwd() });
  }

  let needDemo = !fs.existsSync(SCHOOL_001);
  if (!needDemo) {
    try {
      const { PrismaClient } = await import("../src/lib/prisma-school");
      const url = `file:${SCHOOL_001.replace(/\\/g, "/")}`;
      const db = new PrismaClient({ datasources: { db: { url } } });
      const count = await db.user.count();
      await db.$disconnect();
      needDemo = count === 0;
    } catch {
      needDemo = true;
    }
  }

  if (needDemo) {
    console.log("[MATRIX] Setting up demo school 001 users...");
    execSync("npx tsx scripts/seed-demo.ts", { stdio: "inherit", cwd: process.cwd() });
  }
}

const isDirect =
  process.argv[1]?.includes("ensure-ready") ?? false;
if (isDirect) {
  ensureAppReady()
    .then(() => console.log("[MATRIX] Ready."))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
