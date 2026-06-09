"use client";

import { useEffect, useState } from "react";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";

type KpiData = {
  period: string;
  overallScore: number;
  metrics: {
    name: string;
    weight: number;
    value: number;
    target: number;
    achievement: number;
    weightedScore: number;
  }[];
};

export function KpiPanel() {
  const [data, setData] = useState<KpiData | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/school/kpi?period=${CURRENT_PMS_PERIOD}`, { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.error || "Failed to load KPI");
          setData(null);
        } else {
          setData(d);
        }
      })
      .catch(() => setError("Failed to load KPI"));
  }, []);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!data) return <p className="text-slate-400">Loading KPI engine...</p>;

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="text-slate-400">Weighted KPI Overall Score</p>
        <p className="text-4xl font-bold text-green-400">{data.overallScore}%</p>
        <p className="text-sm text-slate-500">Period: {data.period}</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>KPI</th>
              <th>Weight</th>
              <th>Value</th>
              <th>Target</th>
              <th>Achievement</th>
              <th>Weighted</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((m) => (
              <tr key={m.name}>
                <td>{m.name}</td>
                <td>{(m.weight * 100).toFixed(0)}%</td>
                <td>{m.value}</td>
                <td>{m.target}</td>
                <td>{m.achievement}%</td>
                <td>{m.weightedScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
