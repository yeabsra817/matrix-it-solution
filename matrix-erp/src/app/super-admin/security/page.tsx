import { SecurityDashboard } from "./SecurityDashboard";
import { IntegrityPanel } from "./IntegrityPanel";

export default function SuperAdminSecurityPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Global Security Dashboard</h2>
      <p className="text-slate-400">
        Aggregated monitoring only — no private student academics or HR evaluations.
      </p>
      <IntegrityPanel />
      <SecurityDashboard />
    </div>
  );
}
