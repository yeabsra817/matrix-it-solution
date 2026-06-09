import { getSchoolDb } from "./school-db";
import type { SessionUser } from "./session";
import { UserRole } from "./prisma-school";
import { STAFF_ROLES } from "./staff-roles";
import type {
  DashboardSyncResult,
  SyncedMarkRow,
  SyncedTeacherLink,
} from "./dashboard-sync-types";

function markRow(subject: string, period: string, totalScore: number): SyncedMarkRow {
  return {
    id: `${subject}-${period}`,
    subject,
    period,
    totalScore,
  };
}

function teacherLink(
  id: string,
  name: string,
  email: string,
  className: string
): SyncedTeacherLink {
  return { id, name, email, className };
}

export async function getRoleDashboardSync(
  session: SessionUser
): Promise<DashboardSyncResult> {
  const db = getSchoolDb(session.schoolCode!);
  const syncedAt = new Date().toISOString();

  switch (session.role) {
    case "HR":
    case "SCHOOL_ADMIN":
    case "DIRECTOR": {
      const [staff, students, parents, teachers] = await Promise.all([
        db.user.findMany({
          where: { role: { in: STAFF_ROLES } },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            blockedAt: true,
            mustChangePwd: true,
          },
          orderBy: { fullName: "asc" },
        }),
        db.user.findMany({
          where: { role: UserRole.STUDENT },
          select: { id: true, fullName: true, email: true, blockedAt: true },
          orderBy: { fullName: "asc" },
        }),
        db.user.findMany({
          where: { role: UserRole.PARENT },
          select: { id: true, fullName: true, email: true, blockedAt: true },
          orderBy: { fullName: "asc" },
        }),
        db.user.findMany({
          where: { role: UserRole.TEACHER },
          select: { id: true, fullName: true, email: true },
          orderBy: { fullName: "asc" },
        }),
      ]);
      return {
        syncedAt,
        scope: session.role === "HR" ? "hr" : "admin",
        staff,
        students,
        parents,
        teachers,
        counts: {
          staff: staff.length,
          students: students.length,
          parents: parents.length,
          teachers: teachers.length,
        },
      };
    }

    case "TEACHER": {
      const teacher = await db.teacherProfile.findFirst({
        where: { userId: session.id },
        include: {
          assignments: {
            include: {
              class: {
                include: {
                  enrollments: {
                    include: {
                      student: {
                        include: {
                          user: { select: { id: true, fullName: true, email: true } },
                          parentLinks: {
                            include: {
                              parent: {
                                include: {
                                  user: { select: { id: true, fullName: true, email: true } },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  classSubjects: { include: { subject: true } },
                },
              },
            },
          },
        },
      });
      const classes =
        teacher?.assignments.map((a) => ({
          id: a.class.id,
          name: a.class.name,
          grade: a.class.grade,
          gradeBand: a.class.gradeBand,
          subjects: a.class.classSubjects.map((cs) => cs.subject.name),
          students: a.class.enrollments.map((e) => ({
            id: e.student.user.id,
            name: e.student.user.fullName,
            email: e.student.user.email,
          })),
          parents: [
            ...new Map(
              a.class.enrollments.flatMap((e) =>
                e.student.parentLinks.map((pl) => [
                  pl.parent.user.id,
                  {
                    id: pl.parent.user.id,
                    name: pl.parent.user.fullName,
                    email: pl.parent.user.email,
                    childName: e.student.user.fullName,
                  },
                ])
              )
            ).values(),
          ],
        })) ?? [];
      return { syncedAt, scope: "teacher", classes };
    }

    case "STUDENT": {
      const profile = await db.studentProfile.findFirst({
        where: { userId: session.id },
        include: {
          user: { select: { fullName: true, email: true } },
          enrollments: {
            include: {
              class: {
                include: {
                  enrollments: {
                    include: {
                      student: {
                        include: { user: { select: { id: true, fullName: true } } },
                      },
                    },
                  },
                  assignments: {
                    include: {
                      teacher: {
                        include: {
                          user: { select: { id: true, fullName: true, email: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          marks: { include: { subject: true }, orderBy: { period: "desc" }, take: 20 },
        },
      });

      const classmates =
        profile?.enrollments.flatMap((e) =>
          e.class.enrollments
            .filter((en) => en.student.userId !== session.id)
            .map((en) => ({
              id: en.student.user.id,
              name: en.student.user.fullName,
              className: e.class.name,
            }))
        ) ?? [];

      const teachers: SyncedTeacherLink[] = [
        ...new Map(
          profile?.enrollments.flatMap((e) =>
            e.class.assignments.map((a) => [
              a.teacher.user.id,
              teacherLink(
                a.teacher.user.id,
                a.teacher.user.fullName,
                a.teacher.user.email,
                e.class.name
              ),
            ])
          ) ?? []
        ).values(),
      ];

      const marks: SyncedMarkRow[] =
        profile?.marks.map((m) =>
          markRow(m.subject.name, m.period, m.totalScore)
        ) ?? [];

      return {
        syncedAt,
        scope: "student",
        profile: profile
          ? {
              name: profile.user.fullName,
              email: profile.user.email,
              gradeBand: profile.gradeBand,
              grade: profile.grade,
              classes: profile.enrollments.map((e) => e.class.name),
            }
          : null,
        teachers,
        classmates: [...new Map(classmates.map((c) => [c.id, c])).values()],
        marks,
      };
    }

    case "PARENT": {
      const parent = await db.parentProfile.findFirst({
        where: { userId: session.id },
        include: {
          children: {
            include: {
              student: {
                include: {
                  user: { select: { id: true, fullName: true, email: true } },
                  enrollments: {
                    include: {
                      class: {
                        include: {
                          assignments: {
                            include: {
                              teacher: {
                                include: {
                                  user: {
                                    select: { id: true, fullName: true, email: true },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  marks: {
                    include: { subject: true },
                    orderBy: { period: "desc" },
                    take: 30,
                  },
                },
              },
            },
          },
        },
      });

      const children =
        parent?.children.map((c) => ({
          id: c.student.user.id,
          name: c.student.user.fullName,
          grade: `${c.student.gradeBand} ${c.student.grade}`,
          classes: c.student.enrollments.map((e) => e.class.name),
          teachers: [
            ...new Map(
              c.student.enrollments.flatMap((e) =>
                e.class.assignments.map((a) => [
                  a.teacher.user.id,
                  teacherLink(
                    a.teacher.user.id,
                    a.teacher.user.fullName,
                    a.teacher.user.email,
                    e.class.name
                  ),
                ])
              )
            ).values(),
          ],
          marks: c.student.marks.map((m) =>
            markRow(m.subject.name, m.period, m.totalScore)
          ),
        })) ?? [];

      return { syncedAt, scope: "parent", children };
    }

    default: {
      const staff = await db.user.findMany({
        where: { role: { in: STAFF_ROLES } },
        select: { id: true, fullName: true, email: true, role: true },
        orderBy: { fullName: "asc" },
      });
      return { syncedAt, scope: "staff-list", staff };
    }
  }
}
