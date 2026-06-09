"use client";

import { useCallback, useEffect, useState } from "react";

type Teacher = { id: string; name: string; email: string };

export function PmsEvaluationPanel() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school/pms-evaluations", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Could not load teachers");
        return;
      }
      setTeachers(data.teachers || []);
    } catch {
      setStatus("Sync failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent<HTMLFormElement>, teacherId: string) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/school/pms-evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        teacherUserId: teacherId,
        score: Number(form.get("score")),
        comment: form.get("comment"),
      }),
    });
    const data = await res.json();
    if (!res.ok) setStatus(data.error || "Submit failed");
    else setStatus(`Submitted. Teacher PMS overall: ${data.pms?.overall ?? "—"}%`);
  }

  if (loading) return <p className="text-slate-400">Loading assigned teachers...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Evaluate assigned teachers only. Weights: HR 50%, Students 25%, Parents 25%.
      </p>
      {status && <p className="text-sm text-green-400">{status}</p>}
      {teachers.length === 0 ? (
        <p className="text-slate-400">No assigned teachers to evaluate.</p>
      ) : (
        teachers.map((t) => (
          <form key={t.id} onSubmit={(e) => submit(e, t.id)} className="card space-y-2">
            <h3 className="font-semibold">{t.name}</h3>
            <p className="text-sm text-slate-400">{t.email}</p>
            <input
              className="input"
              name="score"
              type="number"
              min={0}
              max={100}
              placeholder="Score 0-100"
              required
            />
            <textarea className="input" name="comment" rows={2} placeholder="Comment" />
            <button type="submit" className="btn btn-primary">
              Submit Evaluation
            </button>
          </form>
        ))
      )}
      <button type="button" className="btn btn-secondary" onClick={load}>
        Sync
      </button>
    </div>
  );
}
