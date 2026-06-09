"use client";

import { ModuleFrame, useApi } from "./ModuleFrame";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";

export function PmsWeightsPanel() {
  const { data, error } = useApi<{
    hr: number;
    students: number;
    parents: number;
    overall: number;
    weights: { HR: number; STUDENTS: number; PARENTS: number };
  }>(`/api/school/analytics?period=${CURRENT_PMS_PERIOD}&weighted=1`);

  return (
    <ModuleFrame title="PMS System (HR 50% · Students 25% · Parents 25%)">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="card"><p className="text-slate-400">HR (50%)</p><p className="text-2xl font-bold">{data?.hr ?? "—"}%</p></div>
        <div className="card"><p className="text-slate-400">Students (25%)</p><p className="text-2xl font-bold">{data?.students ?? "—"}%</p></div>
        <div className="card"><p className="text-slate-400">Parents (25%)</p><p className="text-2xl font-bold">{data?.parents ?? "—"}%</p></div>
        <div className="card"><p className="text-slate-400">Overall PMS</p><p className="text-2xl font-bold text-green-400">{data?.overall ?? "—"}%</p></div>
      </div>
    </ModuleFrame>
  );
}
