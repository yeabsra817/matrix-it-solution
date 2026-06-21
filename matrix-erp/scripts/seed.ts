import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { PrismaClient as MasterClient } from "../src/lib/prisma-master";
import { hashPassword } from "../src/lib/password";
import { resolveMasterDbUrl } from "../src/lib/db-url";
import {
  DEFAULT_SUPER_ADMIN_EMAIL,
  DEFAULT_SUPER_ADMIN_PASSWORD,
  LEGACY_SUPER_ADMIN_EMAIL,
  LEGACY_SUPER_ADMIN_PASSWORD,
} from "../src/lib/super-admin-defaults";

const master = new MasterClient({
  datasources: { db: { url: resolveMasterDbUrl() } },
});

async function main() {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  const dbUrl = process.env.DATABASE_URL || resolveMasterDbUrl();
  execSync("npx prisma db push --schema=prisma/master/schema.prisma --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  await master.homepageTemplate.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      minTitleLength: 3,
      minMessageLength: 10,
      defaultThemeColor: "#2563eb",
      defaultBackgroundStyle: "gradient",
      requiredFields: "title,message,welcome,contact,announcement",
      structureNote:
        "Schools must keep logo, welcome, announcements, and contact sections.",
    },
  });

  const accounts = [
    { email: DEFAULT_SUPER_ADMIN_EMAIL, password: DEFAULT_SUPER_ADMIN_PASSWORD },
    { email: LEGACY_SUPER_ADMIN_EMAIL, password: LEGACY_SUPER_ADMIN_PASSWORD },
  ];

  for (const acc of accounts) {
    const passwordHash = await hashPassword(acc.password);
    await master.superAdmin.upsert({
      where: { email: acc.email },
      update: { passwordHash, failedAttempts: 0, blockedAt: null },
      create: { email: acc.email, passwordHash },
    });
  }

  console.log("Seed complete — Super Admin accounts ready.");
  console.log(`  ${DEFAULT_SUPER_ADMIN_EMAIL} / ${DEFAULT_SUPER_ADMIN_PASSWORD} (school code ROOT)`);
  console.log(`  ${LEGACY_SUPER_ADMIN_EMAIL} / ${LEGACY_SUPER_ADMIN_PASSWORD} (school code ROOT)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await master.$disconnect();
  });
