import { HrKpiPanel } from "@/components/HrKpiPanel";

export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Manage KPI</h2>
      <p className="text-slate-400">
        Add, edit, or delete teacher KPI metrics. HR assesses staff via PMS evaluations.
      </p>
      <HrKpiPanel />
    </div>
  );
}
