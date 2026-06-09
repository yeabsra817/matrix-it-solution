import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import { logFromSession } from "@/lib/audit";

const schema = z.object({
  minTitleLength: z.number().min(1).max(50),
  minMessageLength: z.number().min(1).max(200),
  defaultThemeColor: z.string().min(4),
  defaultBackgroundStyle: z.string().min(1),
  requiredFields: z.string().min(1),
  structureNote: z.string().optional(),
});

export async function GET() {
  const { session, response } = await requirePermission("createSchool");
  if (response) return response;

  const template = await masterDb.homepageTemplate.upsert({
    where: { id: "default" },
    update: {},
    create: {},
  });
  return NextResponse.json({ template });
}

export async function POST(req: Request) {
  const { session, response } = await requirePermission("createSchool");
  if (response) return response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template input" }, { status: 400 });
  }

  const template = await masterDb.homepageTemplate.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  await logFromSession(session!, "HOMEPAGE_TEMPLATE_UPDATE", "HomepageTemplate", "default");
  return NextResponse.json({ ok: true, template });
}
