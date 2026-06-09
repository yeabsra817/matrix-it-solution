"use client";

import { useEffect, useState } from "react";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";

type KpiData = {
  period: string;
  overallScore: number;
  pms?: { overall: number; students: number; hr: number; parents: number };
  metrics: {
    name: string;
    weight: number;
    value: number;
    target: number;
    achievement: number;
    weightedScore: number;
  }[];
};

export function TeacherKpiPanel() {
  const [data, setData] = useState<KpiData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/school/kpi?period=${CURRENT_PMS_PERIOD}`, { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || "Failed to load");
          setData(null);
        } else {
          setData(d);
        }
      })
      .catch(() => setError("Failed to load KPI"));
  }, []);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading your KPI & PMS results...</p>;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-slate-400">Your KPI Score</p>
          <p className="text-4xl font-bold text-green-400">{data.overallScore}%</p>
        </div>
        {data.pms && (
          <div className="card">
            <p className="text-slate-400">PMS Combined</p>
            <p className="text-4xl font-bold text-blue-400">{data.pms.overall}%</p>
            <p className="text-xs text-slate-500 mt-1">
              HR {data.pms.hr}% · Students {data.pms.students}% · Parents {data.pms.parents}%
            </p>
          </div>
        )}
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>KPI</th>
              <th>Weight</th>
              <th>Score</th>
              <th>Weighted</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td>{(m.weight * 100).toFixed(0)}%</td>
                <td>{m.value}%</td>
                <td>{m.weightedScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Student evaluation is anonymous — you see only the final average (20% of KPI).
      </p>
    </div>
  );
}
