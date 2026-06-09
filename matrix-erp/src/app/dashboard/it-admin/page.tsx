import { getRoleDashboardSync } from "@/lib/dashboard-sync";
import { isStaffListSync } from "@/lib/dashboard-sync-types";
import { getSession } from "@/lib/session";

export default async function ITAdminPage() {
  const session = await getSession();
  const data = await getRoleDashboardSync(session!);

  if (!isStaffListSync(data)) {
    return <p className="text-slate-400">Unable to load staff directory.</p>;
  }

  const { staff, syncedAt } = data;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">IT Admin</h2>
      <p className="text-sm text-slate-400">
        Staff directory (read-only) · synced {new Date(syncedAt).toLocaleString()}
      </p>
      <div className="card overflow-x-auto">
        {staff.length === 0 ? (
          <p className="text-slate-400">No staff records.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>{s.fullName}</td>
                  <td>{s.email}</td>
                  <td>{s.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
