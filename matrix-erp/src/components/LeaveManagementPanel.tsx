"use client";

import { useCallback, useEffect, useState } from "react";

type LeaveRow = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewedBy?: string | null;
  reviewNote?: string | null;
};

export function LeaveManagementPanel({ canReview = false }: { canReview?: boolean }) {
  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/school/leave", { credentials: "same-origin" });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setStatus("Could not load leave requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, decision: "APPROVED" | "REJECTED") {
    setStatus("");
    const res = await fetch("/api/school/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id, status: decision }),
    });
    const data = await res.json();
    if (!res.ok) setStatus(data.error || "Update failed");
    else {
      setStatus(`Leave ${decision.toLowerCase()}.`);
      await load();
    }
  }

  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/school/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        reason: form.get("reason"),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setStatus(data.error || "Submit failed");
      return;
    }
    setStatus("Leave request submitted.");
    e.currentTarget.reset();
    await load();
  }

  return (
    <div className="space-y-4">
      {!canReview && (
        <form onSubmit={apply} className="card grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Start</label>
            <input className="input" type="date" name="startDate" required />
          </div>
          <div>
            <label className="label">End</label>
            <input className="input" type="date" name="endDate" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Reason</label>
            <textarea className="input" name="reason" rows={2} required />
          </div>
          <button type="submit" className="btn btn-primary sm:col-span-2">
            Submit Request
          </button>
        </form>
      )}

      {status && <p className="text-sm text-green-400">{status}</p>}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-slate-400">No leave requests.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Reason</th>
                <th>Status</th>
                {canReview && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {new Date(r.startDate).toLocaleDateString()} –{" "}
                    {new Date(r.endDate).toLocaleDateString()}
                  </td>
                  <td>{r.reason}</td>
                  <td>
                    <span className="badge">{r.status}</span>
                  </td>
                  {canReview && r.status === "PENDING" && (
                    <td className="space-x-2">
                      <button
                        type="button"
                        className="btn btn-primary text-xs"
                        onClick={() => review(r.id, "APPROVED")}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary text-xs"
                        onClick={() => review(r.id, "REJECTED")}
                      >
                        Reject
                      </button>
                    </td>
                  )}
                  {canReview && r.status !== "PENDING" && <td>—</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <button type="button" className="btn btn-secondary" onClick={load}>
        Sync
      </button>
    </div>
  );
}
