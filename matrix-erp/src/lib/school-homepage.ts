import { masterDb } from "./master-db";
import { getSchoolDb } from "./school-db";

export type HomepageBranding = {
  schoolCode: string;
  schoolName: string;
  homepageTitle: string;
  homepageMessage: string;
  welcomeText: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  announcement: string | null;
  themeColor: string;
  backgroundStyle: string;
  logoPosition: string;
  announcementBanner: boolean;
};

export async function getHomepageTemplate() {
  return masterDb.homepageTemplate.upsert({
    where: { id: "default" },
    update: {},
    create: {},
  });
}

export async function getPublicSchoolHomepage(
  code: string
): Promise<HomepageBranding | null> {
  const normalized = code.padStart(3, "0");
  const school = await masterDb.school.findUnique({
    where: { code: normalized },
  });
  if (!school || !school.isActive) return null;

  const template = await getHomepageTemplate();
  const db = getSchoolDb(normalized);
  const settings = await db.schoolSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {},
  });

  return {
    schoolCode: school.code,
    schoolName: school.name,
    homepageTitle: settings.homepageTitle || "Welcome",
    homepageMessage: settings.homepageMessage || school.name,
    welcomeText: settings.welcomeText || "",
    logoUrl: settings.logoUrl,
    phone: settings.phone,
    email: settings.email,
    announcement: settings.announcement,
    themeColor: settings.themeColor || template.defaultThemeColor,
    backgroundStyle: settings.backgroundStyle || template.defaultBackgroundStyle,
    logoPosition: settings.logoPosition || "center",
    announcementBanner: settings.announcementBanner,
  };
}

export function validateHomepageAgainstTemplate(
  data: {
    homepageTitle: string;
    homepageMessage: string;
    welcomeText?: string;
    phone?: string;
    email?: string;
    announcement?: string;
  },
  template: { minTitleLength: number; minMessageLength: number; requiredFields: string }
): string | null {
  if (data.homepageTitle.length < template.minTitleLength) {
    return `Title must be at least ${template.minTitleLength} characters.`;
  }
  if (data.homepageMessage.length < template.minMessageLength) {
    return `Message must be at least ${template.minMessageLength} characters.`;
  }
  const required = template.requiredFields.split(",").map((f) => f.trim());
  if (required.includes("welcome") && !data.welcomeText?.trim()) {
    return "Welcome text is required.";
  }
  if (required.includes("contact") && !data.phone?.trim() && !data.email?.trim()) {
    return "Contact phone or email is required.";
  }
  if (required.includes("announcement") && !data.announcement?.trim()) {
    return "Announcement is required.";
  }
  return null;
}
