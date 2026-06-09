import { AuditLogPanel } from "@/components/AuditLogPanel";

export default function DirectorAuditPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">School Audit Trail</h2>
      <AuditLogPanel />
    </div>
  );
}
