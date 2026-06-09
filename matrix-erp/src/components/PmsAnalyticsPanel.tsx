"use client";

import { useEffect, useState } from "react";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";

type Ranking = {
  rank: number;
  name: string;
  role: string;
  averageScore: number;
};

export function PmsAnalyticsPanel() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [period, setPeriod] = useState(CURRENT_PMS_PERIOD);

  useEffect(() => {
    fetch(`/api/school/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => setRankings(d.rankings || []));
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-3">
        <label className="label mb-0">Period</label>
        <input
          className="input max-w-[160px]"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        />
      </div>
      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-3">PMS Rankings & Scoring</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Role</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((r) => (
              <tr key={r.rank}>
                <td>
                  <span className="badge">#{r.rank}</span>
                </td>
                <td>{r.name}</td>
                <td>{r.role}</td>
                <td>{r.averageScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
