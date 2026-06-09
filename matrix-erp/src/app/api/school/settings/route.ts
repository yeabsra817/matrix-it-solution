import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";
import {
  getHomepageTemplate,
  validateHomepageAgainstTemplate,
} from "@/lib/school-homepage";

const schema = z.object({
  homepageTitle: z.string().min(1),
  homepageMessage: z.string().min(1),
  welcomeText: z.string().optional(),
  logoUrl: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  announcement: z.string().optional(),
  themeColor: z.string().optional(),
  backgroundStyle: z.enum(["gradient", "solid", "pattern"]).optional(),
  logoPosition: z.enum(["left", "center", "right"]).optional(),
  announcementBanner: z.boolean().optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!["SCHOOL_ADMIN", "DIRECTOR"].includes(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const template = await getHomepageTemplate();
  const settings = await db.schoolSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {},
  });
  return NextResponse.json({ settings, template });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (session!.role !== "SCHOOL_ADMIN") {
    return NextResponse.json({ error: "Only School Admin can edit settings" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const template = await getHomepageTemplate();
  const validation = validateHomepageAgainstTemplate(parsed.data, template);
  if (validation) {
    return NextResponse.json({ error: validation }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const settings = await db.schoolSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  await logFromSession(session!, "SCHOOL_SETTINGS_UPDATE", "SchoolSettings", settings.id);
  return NextResponse.json({ ok: true, settings });
}
