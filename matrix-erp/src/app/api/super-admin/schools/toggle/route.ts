import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { masterDb } from "@/lib/master-db";
import { logFromSession } from "@/lib/audit";
import { broadcastSchoolAlert } from "@/lib/notifications";

export async function POST(req: Request) {
  const { session, response } = await requirePermission("createSchool");
  if (response) return response;

  const form = await req.formData();
  const schoolId = String(form.get("schoolId") || "");
  const school = await masterDb.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const isActive = !school.isActive;
  await masterDb.school.update({
    where: { id: schoolId },
    data: { isActive },
  });

  await logFromSession(
    session!,
    isActive ? "SCHOOL_ENABLED" : "SCHOOL_DISABLED",
    "School",
    school.id,
    school.code
  );

  if (!isActive) {
    await broadcastSchoolAlert(
      school.code,
      "School Disabled",
      `School ${school.name} (${school.code}) has been disabled by Super Admin.`,
      "SYSTEM"
    );
  }

  return NextResponse.redirect(new URL("/super-admin/schools", req.url));
}
