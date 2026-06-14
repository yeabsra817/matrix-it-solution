/**
 * Creates bundled SQLite databases for Vercel deployment.
 * Output: prisma/seed/master.db and prisma/seed/schools/001.db (committed to git).
 */
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const ROOT = process.cwd();
const SEED_DIR = path.join(ROOT, "prisma", "seed");
const MASTER_OUT = path.join(SEED_DIR, "master.db");
const SCHOOL_DIR = path.join(SEED_DIR, "schools");

function masterUrl(filePath: string) {
  return `file:${filePath.replace(/\\/g, "/")}`;
}

function main() {
  fs.mkdirSync(SCHOOL_DIR, { recursive: true });

  if (fs.existsSync(MASTER_OUT)) fs.unlinkSync(MASTER_OUT);

  execSync("npx prisma db push --schema=prisma/master/schema.prisma --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: masterUrl(MASTER_OUT) },
  });

  execSync("npx tsx scripts/seed.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: masterUrl(MASTER_OUT) },
  });

  console.log("[build-seed-db] Master DB:", MASTER_OUT);

  try {
    const schoolOut = path.join(SCHOOL_DIR, "001.db");
    const schoolUrl = masterUrl(schoolOut);
    execSync("npx tsx scripts/seed-demo.ts", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: masterUrl(MASTER_OUT),
        SCHOOL_DB_URL: schoolUrl,
      },
    });
    const localDemo = path.join(ROOT, "data", "schools", "001.db");
    if (!fs.existsSync(schoolOut) && fs.existsSync(localDemo)) {
      fs.copyFileSync(localDemo, schoolOut);
    }
    console.log("[build-seed-db] Demo school DB:", schoolOut);
  } catch (err) {
    console.warn("[build-seed-db] Demo school seed skipped:", err);
  }

  console.log("[build-seed-db] Done — seed databases ready for Vercel.");
}

main();
