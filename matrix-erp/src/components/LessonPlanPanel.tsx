"use client";

import { useCallback, useEffect, useState } from "react";

type Plan = {
  id: string;
  title: string;
  content: string;
  status: string;
  directorNote?: string | null;
  subject?: { name: string };
};

type Subject = { id: string; name: string };

export function LessonPlanPanel({ mode }: { mode: "teacher" | "director" }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    const res = await fetch("/api/school/lesson-plans", { credentials: "same-origin" });
    const d = await res.json();
    if (!res.ok) {
      setErr(d.message || "Failed to load");
      return;
    }
    setPlans(d.data?.plans ?? []);
    setSubjects(d.data?.subjects ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/school/lesson-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        subjectId: f.get("subjectId"),
        title: f.get("title"),
        content: f.get("content"),
        academicYear: "2025",
      }),
    });
    const d = await res.json();
    if (!res.ok) setErr(d.message || "Save failed");
    else {
      setMsg("Lesson plan saved (draft).");
      load();
    }
  }

  async function submitPlan(id: string) {
    const res = await fetch("/api/school/lesson-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    if (!res.ok) setErr(d.message || "Submit failed");
    else {
      setMsg("Submitted for director approval.");
      load();
    }
  }

  async function review(id: string, action: "APPROVE" | "REJECT") {
    const note = prompt(action === "REJECT" ? "Rejection reason:" : "Optional note:") || "";
    const res = await fetch("/api/school/lesson-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id, action, note }),
    });
    const d = await res.json();
    if (!res.ok) setErr(d.message || "Action failed");
    else {
      setMsg(`Plan ${action.toLowerCase()}d.`);
      load();
    }
  }

  return (
    <div className="space-y-4">
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}

      {mode === "teacher" && (
        <form onSubmit={save} className="card space-y-3">
          <h3 className="font-semibold">Annual Lesson Plan (one per assigned subject)</h3>
          <select className="input" name="subjectId" required>
            <option value="">Select assigned subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input className="input" name="title" placeholder="Plan title" required />
          <textarea className="input" name="content" rows={6} placeholder="Annual plan content" required />
          <button type="submit" className="btn btn-primary">
            Save Draft
          </button>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td>{p.subject?.name ?? "—"}</td>
                <td>{p.title}</td>
                <td>
                  <span className="badge">{p.status}</span>
                </td>
                <td className="space-x-2">
                  {mode === "teacher" && p.status === "DRAFT" && (
                    <button type="button" className="btn btn-secondary text-xs" onClick={() => submitPlan(p.id)}>
                      Submit
                    </button>
                  )}
                  {mode === "teacher" && p.status === "REJECTED" && (
                    <button type="button" className="btn btn-secondary text-xs" onClick={() => submitPlan(p.id)}>
                      Resubmit
                    </button>
                  )}
                  {mode === "director" && p.status === "SUBMITTED" && (
                    <>
                      <button type="button" className="btn btn-primary text-xs" onClick={() => review(p.id, "APPROVE")}>
                        Approve
                      </button>
                      <button type="button" className="btn btn-secondary text-xs" onClick={() => review(p.id, "REJECT")}>
                        Reject
                      </button>
                    </>
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
