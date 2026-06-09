import { hashPassword } from "./password";
import { DEFAULT_PASSWORD, SUBJECTS } from "./constants";
import { getSchoolDb } from "./school-db";
import { UserRole } from "./prisma-school";

/** Initialize isolated tenant DB with subjects and default school settings. */
export async function initializeSchoolTenant(code: string, name: string) {
  const db = getSchoolDb(code);

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
      homepageTitle: `${name} Portal`,
      homepageMessage: `Welcome to ${name}`,
      welcomeText: "MATRIX IT SOLUTION ERP",
      phone: "+251-11-000-0000",
      email: `info@${code}.edu`,
      announcement: "Welcome to the new academic year.",
      themeColor: "#2563eb",
      backgroundStyle: "gradient",
      logoPosition: "center",
      announcementBanner: true,
    },
  });
}

export async function createDefaultDirectorForSchool(
  code: string,
  name: string,
  email?: string
) {
  const db = getSchoolDb(code);
  const directorEmail = email || `director@${code}.edu`;
  const pwd = await hashPassword(DEFAULT_PASSWORD);

  const existing = await db.user.findUnique({ where: { email: directorEmail } });
  if (existing) return existing.id;

  const user = await db.user.create({
    data: {
      email: directorEmail,
      fullName: `${name} Director`,
      role: UserRole.DIRECTOR,
      passwordHash: pwd,
      mustChangePwd: true,
    },
  });
  return user.id;
}
