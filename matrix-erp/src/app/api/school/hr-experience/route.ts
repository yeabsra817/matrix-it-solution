import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const baseSchema = z.object({
  userId: z.string(),
  seniority: z.enum(["JUNIOR", "SENIOR"]),
  educationLevel: z.string().min(1),
  joiningDate: z.string(),
});

const juniorSchema = baseSchema.extend({
  seniority: z.literal("JUNIOR"),
});

const seniorSchema = baseSchema.extend({
  seniority: z.literal("SENIOR"),
  previousSchools: z.string().min(2),
  totalYearsExperience: z.string().min(1),
  fullJobHistory: z.string().min(2),
  positionsHeld: z.string().min(2),
  certifications: z.string().min(1),
  achievements: z.string().min(1),
  skills: z.string().min(1),
  detailedEducation: z.string().min(2),
  age: z.coerce.number().int().min(18).max(80),
});

const bodySchema = z.union([juniorSchema, seniorSchema]);

export async function POST(req: Request) {
  const { session, response } = await requirePermission("hrExperience");
  if (response) return response;

  const raw = await req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const db = getSchoolDb(session!.schoolCode!);
  const user = await db.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const director = await db.user.findFirst({ where: { role: "DIRECTOR" } });
  const hr = await db.user.findFirst({ where: { role: "HR" } });
  const joiningDate = new Date(parsed.data.joiningDate);

  const base = {
    seniority: parsed.data.seniority,
    educationLevel: parsed.data.educationLevel,
    education: parsed.data.educationLevel,
    joiningDate,
    hrSignatureName: hr?.fullName ?? "HR Officer",
    directorSignatureName: director?.fullName ?? "School Director",
    issuedAt: new Date(),
  };

  const payload =
    parsed.data.seniority === "SENIOR"
      ? {
          ...base,
          experienceLevel: "Senior",
          jobHistory: parsed.data.fullJobHistory,
          previousSchools: parsed.data.previousSchools,
          totalYearsExperience: parsed.data.totalYearsExperience,
          positionsHeld: parsed.data.positionsHeld,
          certifications: parsed.data.certifications,
          achievements: parsed.data.achievements,
          skills: parsed.data.skills,
          detailedEducation: parsed.data.detailedEducation,
          age: parsed.data.age,
        }
      : {
          ...base,
          experienceLevel: "Junior",
          jobHistory: "",
          previousSchools: null,
          totalYearsExperience: null,
          positionsHeld: null,
          certifications: null,
          achievements: null,
          skills: null,
          detailedEducation: null,
          age: null,
        };

  const certificateNo = `HR-${session!.schoolCode}-${Date.now()}`;
  const record = await db.hRExperience.upsert({
    where: { userId: parsed.data.userId },
    update: payload,
    create: { userId: parsed.data.userId, certificateNo, ...payload },
  });

  await db.staffProfile.upsert({
    where: { userId: parsed.data.userId },
    update: { seniority: parsed.data.seniority },
    create: { userId: parsed.data.userId, seniority: parsed.data.seniority },
  });

  await logFromSession(
    session!,
    "HR_EXPERIENCE_SAVE",
    "HRExperience",
    record.id,
    `${parsed.data.seniority}:${record.certificateNo}`
  );

  return NextResponse.json({ ok: true, certificateNo: record.certificateNo });
}

export async function GET() {
  const { session, response } = await requirePermission("hrExperience");
  if (response) return response;
  const db = getSchoolDb(session!.schoolCode!);
  const records = await db.hRExperience.findMany({
    include: { user: { select: { fullName: true, email: true, role: true } } },
    orderBy: { issuedAt: "desc" },
  });
  return NextResponse.json({ records });
}
