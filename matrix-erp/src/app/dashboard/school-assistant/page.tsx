import { getSchoolDb } from "@/lib/school-db";
import { getSession } from "@/lib/session";
import { UserRole } from "@/lib/prisma-school";

export default async function SchoolAssistantPage() {
  const session = await getSession();
  const db = getSchoolDb(session!.schoolCode!);
  const [students, parents, active] = await Promise.all([
    db.user.count({ where: { role: UserRole.STUDENT } }),
    db.user.count({ where: { role: UserRole.PARENT } }),
    db.studentProfile.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">School Assistant Dashboard</h2>
      <p className="text-slate-400">
        Register students and parents for {session!.schoolName} only. Cannot create staff or
        admin accounts.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-slate-400">Students</p>
          <p className="text-3xl font-bold">{students}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Parents</p>
          <p className="text-3xl font-bold">{parents}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Active Students</p>
          <p className="text-3xl font-bold">{active}</p>
        </div>
      </div>
    </div>
  );
}
