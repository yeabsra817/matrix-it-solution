import { RoleRequestForm } from "@/components/RoleRequestForm";
import { masterDb } from "@/lib/master-db";
import { getSession } from "@/lib/session";

export default async function DirectorRoleRequestsPage() {
  const session = await getSession();
  const requests = await masterDb.roleRequest.findMany({
    where: { schoolCode: session!.schoolCode! },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Request New Role</h2>
      <p className="text-slate-400">
        Director requests roles. Super Admin approves. School Admin cannot create
        roles.
      </p>
      <RoleRequestForm />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>User</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.roleName}</td>
                <td>
                  {r.fullName} ({r.userEmail})
                </td>
                <td>
                  <span className="badge">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
