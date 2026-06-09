import { LeaveManagementPanel } from "@/components/LeaveManagementPanel";

export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Leave Approvals</h2>
      <LeaveManagementPanel canReview />
    </div>
  );
}
