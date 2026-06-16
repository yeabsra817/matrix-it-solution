/** Default homepage when database is unavailable (Vercel serverless fallback). */
import type { HomepageBranding } from "./school-homepage";

const DEMO_HOMEPAGES: Record<string, HomepageBranding> = {
  "001": {
    schoolCode: "001",
    schoolName: "Matrix Demo School One",
    homepageTitle: "Matrix Demo School One Portal",
    homepageMessage: "Welcome to Matrix Demo School One",
    welcomeText: "MATRIX IT SOLUTION ERP",
    logoUrl: null,
    phone: "+251-11-000-0000",
    email: "info@001.edu",
    announcement: "Demo school ready for login testing.",
    themeColor: "#2563eb",
    backgroundStyle: "gradient",
    logoPosition: "center",
    announcementBanner: true,
  },
};

export function getDemoHomepage(code: string): HomepageBranding | null {
  return DEMO_HOMEPAGES[code.padStart(3, "0")] ?? null;
}
