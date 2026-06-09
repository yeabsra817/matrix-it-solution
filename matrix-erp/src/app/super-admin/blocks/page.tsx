import { masterDb } from "@/lib/master-db";
import { BlockUserForm } from "./BlockUserForm";

export default async function BlocksPage() {
  const blocks = await masterDb.globalUserBlock.findMany({
    orderBy: { blockedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Global User Blocks</h2>
      <BlockUserForm />
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Reason</th>
              <th>Blocked At</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.id}>
                <td>{b.email}</td>
                <td>{b.reason || "—"}</td>
                <td>{b.blockedAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
