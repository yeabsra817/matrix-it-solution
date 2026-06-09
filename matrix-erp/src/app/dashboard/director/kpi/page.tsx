import { KpiPanel } from "@/components/KpiPanel";

export default function DirectorKpiPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">KPI Engine</h2>
      <p className="text-slate-400">Weighted KPI calculations for school performance.</p>
      <KpiPanel />
    </div>
  );
}
