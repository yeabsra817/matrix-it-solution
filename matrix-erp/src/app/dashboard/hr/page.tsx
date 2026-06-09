import { getSchoolDb } from "@/lib/school-db";
import { getSession } from "@/lib/session";
import { STAFF_ROLES } from "@/lib/staff-roles";
import { UserRole } from "@/lib/prisma-school";

export default async function HRPage() {
  const db = getSchoolDb((await getSession())!.schoolCode!);
  const [staff, experience, suggestions, teachers, students] = await Promise.all([
    db.user.count({ where: { role: { in: STAFF_ROLES } } }),
    db.hRExperience.count(),
    db.roleSuggestion.count(),
    db.user.count({ where: { role: UserRole.TEACHER } }),
    db.user.count({ where: { role: UserRole.STUDENT } }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">HR Dashboard</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card">
          <p className="text-slate-400">All Staff</p>
          <p className="text-3xl font-bold">{staff}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Teachers</p>
          <p className="text-3xl font-bold">{teachers}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Students</p>
          <p className="text-3xl font-bold">{students}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Experience Records</p>
          <p className="text-3xl font-bold">{experience}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Role Suggestions</p>
          <p className="text-3xl font-bold">{suggestions}</p>
        </div>
      </div>
    </div>
  );
}
