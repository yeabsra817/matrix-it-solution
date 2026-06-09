import { StaffManagementPanel } from "@/components/StaffManagementPanel";

export default function HRStaffSyncPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">All Staff — Live Sync</h2>
      <p className="text-slate-400">
        HR sees every staff member in this school. Search, filter, block, activate, and export.
      </p>
      <StaffManagementPanel />
    </div>
  );
}
