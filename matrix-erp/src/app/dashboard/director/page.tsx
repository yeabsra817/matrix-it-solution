import { UserSyncPanel } from "@/components/UserSyncPanel";
import { getRoleDashboardSync } from "@/lib/dashboard-sync";
import { isAdminSync } from "@/lib/dashboard-sync-types";
import { getSession } from "@/lib/session";

export default async function DirectorPage() {
  const session = await getSession();
  const data = await getRoleDashboardSync(session!);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Director — Full School Overview</h2>
      <p className="text-slate-400">
        Manage school operations for {session!.schoolName}. Synced{" "}
        {new Date(data.syncedAt).toLocaleString()}.
      </p>
      <UserSyncPanel session={session!} mode="overview" />
      {isAdminSync(data) && (
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="card">
            <p className="text-slate-400">Staff</p>
            <p className="text-2xl font-bold">{data.counts.staff}</p>
          </div>
          <div className="card">
            <p className="text-slate-400">Students</p>
            <p className="text-2xl font-bold">{data.counts.students}</p>
          </div>
          <div className="card">
            <p className="text-slate-400">Parents</p>
            <p className="text-2xl font-bold">{data.counts.parents}</p>
          </div>
          <div className="card">
            <p className="text-slate-400">Teachers</p>
            <p className="text-2xl font-bold">{data.counts.teachers}</p>
          </div>
        </div>
      )}
    </div>
  );
}
