import { getRoleDashboardSync } from "@/lib/dashboard-sync";
import { isParentSync } from "@/lib/dashboard-sync-types";
import { getSession } from "@/lib/session";

export default async function ParentPage() {
  const session = await getSession();
  const data = await getRoleDashboardSync(session!);

  if (!isParentSync(data)) {
    return <p className="text-slate-400">Unable to load parent data.</p>;
  }

  const { children, syncedAt } = data;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Parent — Child Access Only</h2>
      <p className="text-sm text-slate-400">
        Synced {new Date(syncedAt).toLocaleString()}
      </p>
      {children.length === 0 ? (
        <p className="text-slate-400">No linked children.</p>
      ) : (
        children.map((child) => (
          <div key={child.id} className="card space-y-3">
            <h3 className="font-semibold text-lg">{child.name}</h3>
            <p>Grade: {child.grade}</p>
            <p>Classes: {child.classes.join(", ") || "—"}</p>
            <div>
              <h4 className="font-medium">Teachers</h4>
              {child.teachers.length === 0 ? (
                <p className="text-slate-400 text-sm">No teachers linked.</p>
              ) : (
                <ul className="list-disc ml-5 text-sm">
                  {child.teachers.map((t) => (
                    <li key={t.id}>
                      {t.name} — {t.className} ({t.email})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-medium">Academic Progress</h4>
              {child.marks.length === 0 ? (
                <p className="text-slate-400 text-sm">No marks yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table text-sm">
                    <thead>
                      <tr>
                        <th scope="col">Subject</th>
                        <th scope="col">Period</th>
                        <th scope="col">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {child.marks.map((m) => (
                        <tr key={m.id}>
                          <td>{m.subject}</td>
                          <td>{m.period}</td>
                          <td>{m.totalScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
