import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { buildHRCertificatePdf } from "@/lib/hr-certificate";

export async function GET(req: Request) {
  const { session, response } = await requirePermission("hrExperience");
  if (response) return response;

  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const db = getSchoolDb(session!.schoolCode!);
  const record = await db.hRExperience.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!record) {
    return NextResponse.json({ error: "HR experience not found" }, { status: 404 });
  }

  const pdf = buildHRCertificatePdf({
    fullName: record.user.fullName,
    role: record.user.role,
    schoolName: session!.schoolName || `School ${session!.schoolCode}`,
    seniority: record.seniority,
    educationLevel: record.educationLevel,
    education: record.education,
    detailedEducation: record.detailedEducation,
    joiningDate: record.joiningDate.toLocaleDateString(),
    experienceLevel: record.experienceLevel,
    previousSchools: record.previousSchools,
    totalYearsExperience: record.totalYearsExperience,
    jobHistory: record.jobHistory,
    positionsHeld: record.positionsHeld,
    certifications: record.certifications,
    achievements: record.achievements,
    skills: record.skills,
    age: record.age,
    certificateNo: record.certificateNo,
    hrSignatureName: record.hrSignatureName || "HR Officer",
    directorSignatureName: record.directorSignatureName || "School Director",
    officialDate: record.issuedAt.toLocaleDateString(),
  });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${record.certificateNo}.pdf"`,
    },
  });
}
