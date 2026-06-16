import Link from "next/link";
import { safeAsync } from "@/lib/safe-db";

export default async function SuperAdminHome() {
  const stats = await safeAsync(
    async () => {
      const { getMasterDb } = await import("@/lib/master-db");
      const db = getMasterDb();
      const [schools, pending, blocks, failedLogins] = await Promise.all([
        db.school.count(),
        db.roleRequest.count({ where: { status: "PENDING" } }),
        db.globalUserBlock.count(),
        db.loginLog.count({ where: { success: false } }),
      ]);
      return { schools, pending, blocks, failedLogins };
    },
    { schools: 1, pending: 0, blocks: 0, failedLogins: 0 },
    "super-admin-home"
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Super Admin Control Center</h2>
      <p className="text-slate-400">
        Aggregated global control only — no student academic or HR private evaluation data.
      </p>
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400">Schools</p>
          <p className="text-3xl font-bold">{stats.schools}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Pending Role Requests</p>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Global Blocks</p>
          <p className="text-3xl font-bold">{stats.blocks}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Failed Logins (all)</p>
          <p className="text-3xl font-bold">{stats.failedLogins}</p>
        </div>
      </div>
      <Link href="/super-admin/security" className="btn btn-primary inline-flex">
        Open Security Dashboard
      </Link>
    </div>
  );
}
