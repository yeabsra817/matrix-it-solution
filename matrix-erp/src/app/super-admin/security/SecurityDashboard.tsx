"use client";

import { useEffect, useState } from "react";

type SecurityData = {
  systemHealth: {
    schools: number;
    schoolsActive: number;
    totalSchoolDatabases: number;
    pendingRoleRequests: number;
    globalBlocks: number;
  };
  security: {
    failedLogins24h: number;
    successLogins24h: number;
    failedLoginAlerts: { email: string; schoolCode: string | null; createdAt: string }[];
    roleChangeLogs: { actorEmail: string; action: string; schoolCode: string | null; createdAt: string }[];
    blockedUsers: { email: string; reason: string | null; blockedAt: string }[];
  };
};

export function SecurityDashboard() {
  const [data, setData] = useState<SecurityData | null>(null);

  useEffect(() => {
    fetch("/api/super-admin/security", { credentials: "same-origin" })
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("[SecurityDashboard]", err));
  }, []);

  if (!data) return <p className="text-slate-400">Loading security data...</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-slate-400">Active Schools</p>
          <p className="text-3xl font-bold">
            {data.systemHealth.schoolsActive}/{data.systemHealth.schools}
          </p>
        </div>
        <div className="card">
          <p className="text-slate-400">Tenant DBs</p>
          <p className="text-3xl font-bold">{data.systemHealth.totalSchoolDatabases}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Failed Logins (24h)</p>
          <p className="text-3xl font-bold text-red-400">{data.security.failedLogins24h}</p>
        </div>
        <div className="card">
          <p className="text-slate-400">Success Logins (24h)</p>
          <p className="text-3xl font-bold text-green-400">{data.security.successLogins24h}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-2">Failed Login Alerts</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Email</th>
              <th>School</th>
            </tr>
          </thead>
          <tbody>
            {data.security.failedLoginAlerts.map((l) => (
              <tr key={l.email + l.createdAt}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.email}</td>
                <td>{l.schoolCode || "ROOT"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-2">Role Change Logs</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>School</th>
            </tr>
          </thead>
          <tbody>
            {data.security.roleChangeLogs.map((l) => (
              <tr key={l.actorEmail + l.createdAt}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.actorEmail}</td>
                <td>{l.action}</td>
                <td>{l.schoolCode || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
