import { getRoleDashboardSync } from "@/lib/dashboard-sync";
import { isTeacherSync } from "@/lib/dashboard-sync-types";
import { getSession } from "@/lib/session";

export default async function TeacherPage() {
  const session = await getSession();
  const data = await getRoleDashboardSync(session!);

  if (!isTeacherSync(data)) {
    return <p className="text-slate-400">Unable to load teacher data.</p>;
  }

  const { classes, syncedAt } = data;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Teacher — Assigned Data Only</h2>
      <p className="text-sm text-slate-400">
        Synced {new Date(syncedAt).toLocaleString()}
      </p>
      {classes.length === 0 ? (
        <p className="text-slate-400">No class assignments yet.</p>
      ) : (
        classes.map((c) => (
          <div key={c.id} className="card space-y-3">
            <h3 className="font-semibold text-lg">{c.name}</h3>
            <p className="text-sm text-slate-400">
              {c.gradeBand} — Grade {c.grade}
            </p>
            <p>Subjects: {c.subjects.join(", ") || "—"}</p>
            <div>
              <h4 className="font-medium">Students</h4>
              {c.students.length === 0 ? (
                <p className="text-slate-400 text-sm">No students enrolled.</p>
              ) : (
                <ul className="list-disc ml-5">
                  {c.students.map((s) => (
                    <li key={s.id}>{s.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h4 className="font-medium">Parents</h4>
              {c.parents.length === 0 ? (
                <p className="text-slate-400 text-sm">No parents linked.</p>
              ) : (
                <ul className="list-disc ml-5 text-sm">
                  {c.parents.map((p) => (
                    <li key={p.id}>
                      {p.name} (child: {p.childName})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
