import { AuditLogPanel } from "@/components/AuditLogPanel";

export default function SuperAdminAuditPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Global Audit & Login Tracking</h2>
      <AuditLogPanel />
    </div>
  );
}
