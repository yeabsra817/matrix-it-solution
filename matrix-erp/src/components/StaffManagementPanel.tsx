"use client";

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  blockedAt: string | null;
  mustChangePwd: boolean;
};

export function StaffManagementPanel({
  canBlock = true,
  canExport = true,
}: {
  canBlock?: boolean;
  canExport?: boolean;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filter, setFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [status, setStatus] = useState("");
  const [syncedAt, setSyncedAt] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/school/users?scope=staff", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || `Sync failed (${res.status})`);
        setUsers([]);
        return;
      }
      setUsers(data.users || []);
      setSyncedAt(data.syncedAt || new Date().toISOString());
    } catch {
      setStatus("Could not load staff. Try Sync again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setUserStatus(userId: string, action: "block" | "unblock") {
    setStatus("");
    const res = await fetch("/api/school/users/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ userId, action }),
    });
    const data = await res.json();
    if (!res.ok) setStatus(data.error || "Action failed");
    else {
      setStatus(`User ${action === "block" ? "blocked" : "activated"}.`);
      await load();
    }
  }

  const filtered = users.filter((u) => {
    const q = filter.toLowerCase();
    const matchQ =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchQ && matchRole;
  });

  const roles = [...new Set(users.map((u) => u.role))].sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="label">Search</label>
          <input
            className="input"
            placeholder="Name or email"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select
            className="input"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load}>
          Sync
        </button>
        {canExport && (
          <a className="btn btn-primary" href="/api/school/users/export">
            Export CSV
          </a>
        )}
      </div>

      {syncedAt && (
        <p className="text-sm text-slate-400">
          Live sync — {filtered.length} staff · {new Date(syncedAt).toLocaleString()}
        </p>
      )}
      {status && <p className="text-sm text-green-400">{status}</p>}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-slate-400">Loading staff...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400">No staff found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                {canBlock && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.blockedAt ? (
                      <span className="badge bg-red-700">Blocked</span>
                    ) : u.mustChangePwd ? (
                      <span className="badge bg-amber-700">Pwd Change</span>
                    ) : (
                      <span className="badge">Active</span>
                    )}
                  </td>
                  {canBlock && (
                    <td className="space-x-2">
                      {u.blockedAt ? (
                        <button
                          type="button"
                          className="btn btn-secondary text-xs"
                          onClick={() => setUserStatus(u.id, "unblock")}
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary text-xs"
                          onClick={() => setUserStatus(u.id, "block")}
                        >
                          Block
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
