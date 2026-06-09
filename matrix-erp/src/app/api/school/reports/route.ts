import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getSchoolDb } from "@/lib/school-db";
import { buildCsv, buildPdfReport } from "@/lib/reports";

export async function GET(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!["DIRECTOR", "SCHOOL_ADMIN", "ACCOUNTANT", "HR"].includes(session!.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = new URL(req.url).searchParams.get("format") || "pdf";
  const type = new URL(req.url).searchParams.get("type") || "users";
  const db = getSchoolDb(session!.schoolCode!);

  let rows: string[][] = [["Report", session!.schoolName || session!.schoolCode || ""]];

  if (type === "users") {
    const users = await db.user.findMany({ select: { fullName: true, email: true, role: true } });
    rows = [["Name", "Email", "Role"], ...users.map((u) => [u.fullName, u.email, u.role])];
  } else if (type === "marks") {
    const marks = await db.markRecord.findMany({
      include: { student: { include: { user: true } }, subject: true },
    });
    rows = [
      ["Student", "Subject", "Assignment", "Exam", "Final", "Total"],
      ...marks.map((m) => [
        m.student.user.fullName,
        m.subject.name,
        String(m.assignmentScore),
        String(m.examScore),
        String(m.finalScore),
        String(m.totalScore),
      ]),
    ];
  } else if (type === "attendance") {
    const att = await db.attendanceRecord.findMany({ take: 500 });
    rows = [
      ["Date", "StudentId", "Status"],
      ...att.map((a) => [a.date, a.studentId, a.status]),
    ];
  }

  const title = `MATRIX Report — ${type}`;

  if (format === "csv" || format === "excel") {
    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${type}-report.csv"`,
      },
    });
  }

  const pdf = buildPdfReport(title, rows);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-report.pdf"`,
    },
  });
}
