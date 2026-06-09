"use client";

import { useCallback, useEffect, useState } from "react";
import { CreateUserForm } from "./CreateUserForm";

type StudentRow = {
  id: string;
  userId: string;
  status: string;
  grade: string;
  gradeBand: string;
  guardianName?: string | null;
  user: { id: string; fullName: string; email: string };
  parentLinks: Array<{
    id: string;
    relation: string;
    parent: { user: { fullName: string; email: string } };
  }>;
  enrollments: Array<{ class: { id: string; name: string } }>;
};

type LinkData = {
  students: StudentRow[];
  parents: Array<{ id: string; userId: string; user: { id: string; fullName: string } }>;
  classes: Array<{ id: string; name: string }>;
  statuses: string[];
};

export function SchoolOfficerPanel() {
  const [data, setData] = useState<LinkData | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school/linking", { credentials: "same-origin" });
      const json = await res.json();
      if (!res.ok) {
        setStatus(json.error || "Sync failed");
        return;
      }
      setData(json);
    } catch {
      setStatus("Could not load linking data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function postAction(body: Record<string, unknown>) {
    setStatus("");
    const res = await fetch("/api/school/linking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) setStatus(json.error || "Action failed");
    else {
      setStatus("Saved.");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <CreateUserForm
        title="Register Student or Parent"
        allowedRoles={["STUDENT", "PARENT"]}
      />

      {status && <p className="text-sm text-green-400">{status}</p>}

      {loading ? (
        <p className="text-slate-400">Syncing students...</p>
      ) : !data?.students.length ? (
        <p className="text-slate-400">No students registered.</p>
      ) : (
        data.students.map((s) => (
          <div key={s.id} className="card space-y-3">
            <h3 className="font-semibold">{s.user.fullName}</h3>
            <p className="text-sm text-slate-400">
              {s.gradeBand} {s.grade} · Status: {s.status}
            </p>
            <form
              className="grid sm:grid-cols-2 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                postAction({
                  action: "update_status",
                  studentUserId: s.user.id,
                  status: form.get("status"),
                  guardianName: form.get("guardianName"),
                  guardianPhone: form.get("guardianPhone"),
                });
              }}
            >
              <select className="input" name="status" defaultValue={s.status}>
                {data.statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              <input
                className="input"
                name="guardianName"
                placeholder="Guardian name"
                defaultValue={s.guardianName || ""}
              />
              <input
                className="input"
                name="guardianPhone"
                placeholder="Guardian phone"
              />
              <button type="submit" className="btn btn-primary sm:col-span-2">
                Update Status / Guardian
              </button>
            </form>
            <form
              className="flex flex-wrap gap-2 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                postAction({
                  action: "enroll_class",
                  studentUserId: s.user.id,
                  classId: form.get("classId"),
                });
              }}
            >
              <select className="input flex-1" name="classId" required>
                <option value="">Assign class</option>
                {data.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-secondary">
                Enroll
              </button>
            </form>
            <form
              className="flex flex-wrap gap-2 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                postAction({
                  action: "link_parent",
                  studentUserId: s.user.id,
                  parentUserId: form.get("parentUserId"),
                  relation: form.get("relation"),
                });
              }}
            >
              <select className="input flex-1" name="parentUserId" required>
                <option value="">Link parent</option>
                {data.parents.map((p) => (
                  <option key={p.id} value={p.user.id}>
                    {p.user.fullName}
                  </option>
                ))}
              </select>
              <input className="input" name="relation" placeholder="Relation" />
              <button type="submit" className="btn btn-secondary">
                Link Parent
              </button>
            </form>
            {s.parentLinks.length > 0 && (
              <ul className="text-sm list-disc ml-5">
                {s.parentLinks.map((pl) => (
                  <li key={pl.id}>
                    {pl.parent.user.fullName} ({pl.relation})
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
      <button type="button" className="btn btn-secondary" onClick={load}>
        Sync
      </button>
    </div>
  );
}
