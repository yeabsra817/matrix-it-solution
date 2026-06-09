import { TeacherKpiPanel } from "@/components/TeacherKpiPanel";

export default function TeacherKpiPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">KPI & PMS Results</h2>
      <p className="text-slate-400">Your performance scores from auto KPI, HR, and student evaluation.</p>
      <TeacherKpiPanel />
    </div>
  );
}
