import Link from "next/link";
import { masterDb } from "@/lib/master-db";

export default async function SuperAdminHome() {
  const [schools, pending, blocks, failedLogins] = await Promise.all([
    masterDb.school.count(),
    masterDb.roleRequest.count({ where: { status: "PENDING" } }),
    masterDb.globalUserBlock.count(),
    masterDb.loginLog.count({ where: { success: false } }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Super Admin Control Center</h2>
      <p className="text-slate-400">
        Aggregated global control only — no student academic or HR private evaluation data.
      </p>
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400">Schools</p>
          <p className="text-3xl font-bold">{schools}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Pending Role Requests</p>
          <p className="text-3xl font-bold">{pending}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Global Blocks</p>
          <p className="text-3xl font-bold">{blocks}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Failed Logins (all)</p>
          <p className="text-3xl font-bold">{failedLogins}</p>
        </div>
      </div>
      <Link href="/super-admin/security" className="btn btn-primary inline-flex">
        Open Security Dashboard
      </Link>
    </div>
  );
}
