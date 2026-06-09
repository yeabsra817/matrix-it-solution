import { masterDb } from "@/lib/master-db";
import { RoleRequestActions } from "./RoleRequestActions";

export default async function RoleRequestsPage() {
  const requests = await masterDb.roleRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Role Approval Queue</h2>
      <p className="text-slate-400">
        Directors request roles. Super Admin approves or rejects. School Admin
        cannot create roles.
      </p>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>School</th>
              <th>Role</th>
              <th>User</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.schoolCode}</td>
                <td>{r.roleName}</td>
                <td>
                  {r.fullName} ({r.userEmail})
                </td>
                <td>
                  <span className="badge">{r.status}</span>
                </td>
                <td>
                  {r.status === "PENDING" ? (
                    <RoleRequestActions id={r.id} />
                  ) : (
                    r.reviewNote || "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
