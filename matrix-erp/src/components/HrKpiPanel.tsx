"use client";

import { useCallback, useEffect, useState } from "react";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";

type Metric = {
  name: string;
  weight: number;
  value: number;
  target: number;
};

export function HrKpiPanel() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/school/kpi?period=${CURRENT_PMS_PERIOD}&roleGroup=TEACHER`,
      { credentials: "same-origin" }
    );
    const d = await res.json();
    if (!res.ok) setErr(d.error || "Failed to load");
    else setMetrics(d.metrics?.map((m: Metric & { achievement?: number }) => m) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/school/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name: f.get("name"),
        weight: Number(f.get("weight")) / 100,
        target: Number(f.get("target")),
        roleGroup: "TEACHER",
        period: CURRENT_PMS_PERIOD,
      }),
    });
    const d = await res.json();
    if (!res.ok) setErr(d.error || "Save failed");
    else {
      setMsg("KPI metric saved.");
      load();
      e.currentTarget.reset();
    }
  }

  async function remove(name: string) {
    if (!confirm(`Delete KPI "${name}"?`)) return;
    const res = await fetch("/api/school/kpi", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name, roleGroup: "TEACHER", period: CURRENT_PMS_PERIOD }),
    });
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error || "Delete failed");
    } else {
      setMsg("KPI metric deleted.");
      load();
    }
  }

  return (
    <div className="space-y-4">
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <p className="text-green-400 text-sm">{msg}</p>}

      <form onSubmit={save} className="card grid md:grid-cols-4 gap-3">
        <input className="input" name="name" placeholder="KPI name" required />
        <input
          className="input"
          name="weight"
          type="number"
          min={1}
          max={100}
          placeholder="Weight %"
          required
        />
        <input
          className="input"
          name="target"
          type="number"
          defaultValue={100}
          placeholder="Target"
          required
        />
        <button type="submit" className="btn btn-primary">
          Add / Update KPI
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Weight</th>
              <th>Target</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td>{(m.weight * 100).toFixed(0)}%</td>
                <td>{m.target}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger text-xs"
                    onClick={() => remove(m.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
