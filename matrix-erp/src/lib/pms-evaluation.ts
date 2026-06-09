import { getSchoolDb } from "./school-db";
import { UserRole } from "./prisma-school";
import { PMS_WEIGHTS, CURRENT_PMS_PERIOD } from "./constants";

export async function computeTeacherPmsFromEvaluations(
  schoolCode: string,
  teacherUserId: string,
  period: string = CURRENT_PMS_PERIOD
) {
  const db = getSchoolDb(schoolCode);
  const evaluations = await db.teacherEvaluation.findMany({
    where: { teacherUserId, period },
  });

  const hr = evaluations.filter((e) => e.evaluatorRole === "HR");
  const students = evaluations.filter((e) => e.evaluatorRole === "STUDENT");
  const parents = evaluations.filter((e) => e.evaluatorRole === "PARENT");

  const avg = (rows: typeof evaluations) =>
    rows.length
      ? rows.reduce((s, r) => s + (r.score / r.maxScore) * 100, 0) / rows.length
      : 0;

  const hrScore = avg(hr);
  const studentScore = avg(students);
  const parentScore = avg(parents);

  const total =
    hrScore * PMS_WEIGHTS.HR +
    studentScore * PMS_WEIGHTS.STUDENTS +
    parentScore * PMS_WEIGHTS.PARENTS;

  return {
    period,
    weights: PMS_WEIGHTS,
    hr: Math.round(hrScore * 100) / 100,
    students: Math.round(studentScore * 100) / 100,
    parents: Math.round(parentScore * 100) / 100,
    overall: Math.round(total * 100) / 100,
    counts: { hr: hr.length, students: students.length, parents: parents.length },
  };
}

export async function getAssignedTeachersForEvaluator(
  schoolCode: string,
  evaluatorUserId: string,
  evaluatorRole: string
) {
  const db = getSchoolDb(schoolCode);

  if (evaluatorRole === "STUDENT") {
    const student = await db.studentProfile.findFirst({
      where: { userId: evaluatorUserId },
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                assignments: {
                  include: { teacher: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
    });
    const map = new Map<string, { id: string; name: string; email: string }>();
    student?.enrollments.forEach((e) =>
      e.class.assignments.forEach((a) =>
        map.set(a.teacher.user.id, {
          id: a.teacher.user.id,
          name: a.teacher.user.fullName,
          email: a.teacher.user.email,
        })
      )
    );
    return [...map.values()];
  }

  if (evaluatorRole === "HR" || evaluatorRole === "DIRECTOR" || evaluatorRole === "SCHOOL_ADMIN") {
    const teachers = await db.user.findMany({
      where: { role: UserRole.TEACHER },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    });
    return teachers.map((t) => ({
      id: t.id,
      name: t.fullName,
      email: t.email,
    }));
  }

  if (evaluatorRole === "PARENT") {
    const parent = await db.parentProfile.findFirst({
      where: { userId: evaluatorUserId },
      include: {
        children: {
          include: {
            student: {
              include: {
                enrollments: {
                  include: {
                    class: {
                      include: {
                        assignments: {
                          include: { teacher: { include: { user: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const map = new Map<string, { id: string; name: string; email: string }>();
    parent?.children.forEach((c) =>
      c.student.enrollments.forEach((e) =>
        e.class.assignments.forEach((a) =>
          map.set(a.teacher.user.id, {
            id: a.teacher.user.id,
            name: a.teacher.user.fullName,
            email: a.teacher.user.email,
          })
        )
      )
    );
    return [...map.values()];
  }

  return [];
}
