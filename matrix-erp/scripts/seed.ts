import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { PrismaClient as MasterClient } from "../src/lib/prisma-master";
import { hashPassword } from "../src/lib/password";

const master = new MasterClient();

async function main() {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  execSync("npx prisma db push --schema=prisma/master/schema.prisma --accept-data-loss", {
    stdio: "inherit",
  });

  const superPwd = await hashPassword("227387");
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

  await master.superAdmin.upsert({
    where: { email: "yeabsra45@gmail.com" },
    update: { passwordHash: superPwd, failedAttempts: 0, blockedAt: null },
    create: {
      email: "yeabsra45@gmail.com",
      passwordHash: superPwd,
    },
  });

  console.log("Seed complete — Super Admin only.");
  console.log("Super Admin: yeabsra45@gmail.com / 227387 (school code ROOT)");
  console.log(
    "Create schools via Super Admin UI, then SCHOOL_ADMIN/DIRECTOR via hierarchy."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await master.$disconnect();
  });
