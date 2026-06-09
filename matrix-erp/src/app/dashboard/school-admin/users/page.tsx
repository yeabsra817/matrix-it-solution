import { UserSyncPanel } from "@/components/UserSyncPanel";
import { StaffManagementPanel } from "@/components/StaffManagementPanel";
import { getSession } from "@/lib/session";

export default async function SchoolAdminUsersPage() {
  const session = await getSession();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">School User Management</h2>
      <p className="text-slate-400">
        Full school control — all staff, students, and parents synced from your tenant database.
      </p>
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">All Staff</h3>
        <StaffManagementPanel />
      </section>
      <section className="space-y-2">
        <h3 className="text-lg font-semibold">All Users</h3>
        <UserSyncPanel session={session!} mode="all" />
      </section>
    </div>
  );
}
