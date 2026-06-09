import { getRoleDashboardSync } from "@/lib/dashboard-sync";
import { isStudentSync } from "@/lib/dashboard-sync-types";
import { getSession } from "@/lib/session";

export default async function StudentPage() {
  const session = await getSession();
  const data = await getRoleDashboardSync(session!);

  if (!isStudentSync(data)) {
    return <p className="text-slate-400">Unable to load student data.</p>;
  }

  const { profile, teachers, classmates, marks, syncedAt } = data;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Student — Own Records</h2>
      <p className="text-sm text-slate-400">
        Synced {new Date(syncedAt).toLocaleString()} · teachers, classmates, marks from database
      </p>
      {profile ? (
        <div className="card space-y-2">
          <p>
            <strong>Name:</strong> {profile.name}
          </p>
          <p>
            <strong>Grade:</strong> {profile.gradeBand} {profile.grade}
          </p>
          <p>
            <strong>Classes:</strong> {profile.classes.join(", ") || "—"}
          </p>
        </div>
      ) : null}
      <div className="card">
        <h3 className="font-semibold mb-2">Assigned Teachers</h3>
        {teachers.length === 0 ? (
          <p className="text-slate-400">No teachers assigned yet.</p>
        ) : (
          <ul className="list-disc ml-5 space-y-1">
            {teachers.map((t) => (
              <li key={t.id}>
                {t.name} — {t.className} ({t.email})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">Classmates</h3>
        {classmates.length === 0 ? (
          <p className="text-slate-400">No classmates in your classes.</p>
        ) : (
          <ul className="list-disc ml-5 space-y-1">
            {classmates.map((c) => (
              <li key={c.id}>
                {c.name} ({c.className})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card">
        <h3 className="font-semibold mb-2">My Marks</h3>
        {marks.length === 0 ? (
          <p className="text-slate-400">No marks recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Subject</th>
                  <th scope="col">Period</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) => (
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
  );
}
