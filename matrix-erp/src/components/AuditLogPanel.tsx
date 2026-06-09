"use client";

import { useEffect, useState } from "react";

export function AuditLogPanel() {
  const [auditLogs, setAuditLogs] = useState<
    { id: string; actorEmail: string; action: string; details?: string; createdAt: string }[]
  >([]);
  const [loginLogs, setLoginLogs] = useState<
    { id: string; email: string; success: boolean; createdAt: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/audit?limit=30")
      .then((r) => r.json())
      .then((d) => {
        setAuditLogs(d.auditLogs || []);
        setLoginLogs(d.loginLogs || []);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-2">Audit Trail</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.actorEmail}</td>
                <td>{l.action}</td>
                <td>{l.details || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card overflow-x-auto">
        <h3 className="font-semibold mb-2">Login Tracking</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loginLogs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
                <td>{l.email}</td>
                <td>
                  <span className={`badge ${l.success ? "" : "bg-red-700"}`}>
                    {l.success ? "Success" : "Failed"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
