import { getSchoolDb } from "@/lib/school-db";
import type { SessionUser } from "@/lib/session";
import { UserRole } from "@/lib/prisma-school";
import { STAFF_ROLES } from "@/lib/staff-roles";

export async function UserSyncPanel({
  session,
  mode,
}: {
  session: SessionUser;
  mode: "all" | "staff" | "overview";
}) {
  const db = getSchoolDb(session.schoolCode!);

  if (mode === "overview") {
    const [total, staff, students, teachers] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: { role: { in: STAFF_ROLES } },
      }),
      db.user.count({ where: { role: UserRole.STUDENT } }),
      db.user.count({ where: { role: UserRole.TEACHER } }),
    ]);
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-slate-400">Total Users</p>
          <p className="text-3xl font-bold">{total}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Staff</p>
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
      </div>
    );
  }

  const users = await db.user.findMany({
    where:
      mode === "staff"
        ? { role: { in: STAFF_ROLES } }
        : undefined,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      blockedAt: true,
      mustChangePwd: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="card overflow-x-auto">
      <p className="text-sm text-slate-400 mb-3">
        Live sync — {users.length} user(s) · updated automatically
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.fullName}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                {u.blockedAt ? (
                  <span className="badge bg-red-700">Blocked</span>
                ) : u.mustChangePwd ? (
                  <span className="badge bg-amber-700">Pwd Change</span>
                ) : (
                  <span className="badge">Active</span>
                )}
              </td>
              <td>{u.updatedAt.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
