/**
 * Seeds school 001 with demo users for testing/demo.
 * Password for all demo users: 1234 (mustChangePwd: true — change on first login)
 */
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { PrismaClient as MasterClient } from "../src/lib/prisma-master";
import { PrismaClient as SchoolClient, UserRole } from "../src/lib/prisma-school";
import { hashPassword } from "../src/lib/password";
import { DEFAULT_PASSWORD, SUBJECTS } from "../src/lib/constants";

const SCHOOL_CODE = "001";
const SCHOOL_NAME = "Matrix Demo School One";

const DEMO_USERS: {
  email: string;
  fullName: string;
  role: UserRole;
}[] = [
  { email: "director@001.edu", fullName: "School Director", role: UserRole.DIRECTOR },
  { email: "admin@001.edu", fullName: "School Admin", role: UserRole.SCHOOL_ADMIN },
  { email: "hr@001.edu", fullName: "HR Manager", role: UserRole.HR },
  { email: "teacher@001.edu", fullName: "Demo Teacher", role: UserRole.TEACHER },
  { email: "accountant@001.edu", fullName: "Finance Officer", role: UserRole.ACCOUNTANT },
  { email: "purchaser@001.edu", fullName: "Purchaser", role: UserRole.PURCHASER },
  { email: "store@001.edu", fullName: "Store Manager", role: UserRole.STORE_MANAGER },
  { email: "staff@001.edu", fullName: "Academic Staff", role: UserRole.STAFF },
  { email: "student@001.edu", fullName: "Demo Student", role: UserRole.STUDENT },
];

function schoolUrl(code: string) {
  const normalized = code.padStart(3, "0");
  const dir = path.join(process.cwd(), "data", "schools");
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, `${normalized}.db`).replace(/\\/g, "/");
  return `file:${dbPath}`;
}

function pushSchoolDb(code: string) {
  execSync(
    "npx prisma db push --schema=prisma/school/schema.prisma --skip-generate --accept-data-loss",
    {
      env: { ...process.env, SCHOOL_DB_URL: schoolUrl(code) },
      stdio: "inherit",
    }
  );
}

async function main() {
  const master = new MasterClient();
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });

  execSync("npx prisma db push --schema=prisma/master/schema.prisma --skip-generate", {
    stdio: "inherit",
  });

  const dbPath = schoolUrl(SCHOOL_CODE).replace("file:", "");
  await master.school.upsert({
    where: { code: SCHOOL_CODE },
    update: { name: SCHOOL_NAME, dbPath, isActive: true },
    create: { code: SCHOOL_CODE, name: SCHOOL_NAME, dbPath, isActive: true },
  });

  pushSchoolDb(SCHOOL_CODE);

  const db = new SchoolClient({
    datasources: { db: { url: schoolUrl(SCHOOL_CODE) } },
  });

  const pwd = await hashPassword(DEFAULT_PASSWORD);

  for (const subject of SUBJECTS) {
    await db.subject.upsert({
      where: { name: subject },
      update: {},
      create: { name: subject },
    });
  }

  await db.schoolSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      homepageTitle: `${SCHOOL_NAME} Portal`,
      homepageMessage: `Welcome to ${SCHOOL_NAME}`,
      welcomeText: "MATRIX IT SOLUTION ERP",
      phone: "+251-11-000-0000",
      email: "info@001.edu",
      announcement: "Demo school ready for login testing.",
      themeColor: "#2563eb",
      backgroundStyle: "gradient",
      logoPosition: "center",
      announcementBanner: true,
    },
  });

  for (const u of DEMO_USERS) {
    await db.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        role: u.role,
        passwordHash: pwd,
        mustChangePwd: true,
        failedAttempts: 0,
        blockedAt: null,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        passwordHash: pwd,
        mustChangePwd: true,
      },
    });
  }

  const teacherUser = await db.user.findUnique({ where: { email: "teacher@001.edu" } });
  const studentUser = await db.user.findUnique({ where: { email: "student@001.edu" } });

  if (teacherUser) {
    const teacher = await db.teacherProfile.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: { userId: teacherUser.id },
    });

    const schoolClass = await db.schoolClass.upsert({
      where: { id: "001-demo-5A" },
      update: { name: "Grade 5A" },
      create: {
        id: "001-demo-5A",
        gradeBand: "PRIMARY",
        grade: "5",
        section: "A",
        name: "Grade 5A",
      },
    });

    await db.classAssignment.upsert({
      where: { classId_teacherId: { classId: schoolClass.id, teacherId: teacher.id } },
      update: {},
      create: { classId: schoolClass.id, teacherId: teacher.id },
    });

    if (studentUser) {
      const student = await db.studentProfile.upsert({
        where: { userId: studentUser.id },
        update: { status: "ACTIVE", grade: "5", gradeBand: "PRIMARY" },
        create: {
          userId: studentUser.id,
          gradeBand: "PRIMARY",
          grade: "5",
          status: "ACTIVE",
        },
      });

      await db.classEnrollment.upsert({
        where: { classId_studentId: { classId: schoolClass.id, studentId: student.id } },
        update: {},
        create: { classId: schoolClass.id, studentId: student.id },
      });
    }

    const math = await db.subject.findFirst({ where: { name: "Math" } });
    if (math && studentUser) {
      const student = await db.studentProfile.findUnique({ where: { userId: studentUser.id } });
      if (student) {
        await db.markRecord.upsert({
          where: {
            studentId_subjectId_period: {
              studentId: student.id,
              subjectId: math.id,
              period: "2025-Q2",
            },
          },
          update: {},
          create: {
            studentId: student.id,
            subjectId: math.id,
            period: "2025-Q2",
            assignmentScore: 28,
            examScore: 27,
            finalScore: 35,
            totalScore: 30.5,
          },
        });
      }
    }
  }

  for (const u of DEMO_USERS) {
    const user = await db.user.findUnique({ where: { email: u.email } });
    if (!user) continue;
    if (u.role === UserRole.TEACHER) {
      await db.teacherProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }
    if (u.role === UserRole.STUDENT) {
      await db.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          gradeBand: "PRIMARY",
          grade: "5",
          status: "ACTIVE",
        },
      });
    }
    if (
      u.role === UserRole.DIRECTOR ||
      u.role === UserRole.SCHOOL_ADMIN ||
      u.role === UserRole.HR
    ) {
      await db.staffProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
      });
    }
  }

  console.log("\n✓ Demo school 001 seeded successfully.\n");
  console.log("School code: 001");
  console.log("Password for all users: 1234\n");
  for (const u of DEMO_USERS) {
    console.log(`  [${u.role}] ${u.email}`);
  }

  await db.$disconnect();
  await master.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
