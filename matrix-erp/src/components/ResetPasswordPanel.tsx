"use client";

import { useEffect, useState } from "react";

export function ResetPasswordPanel() {
  const [users, setUsers] = useState<{ id: string; fullName: string; email: string; role: string }[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/school/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []));
  }, []);

  async function reset(userId: string) {
    const res = await fetch("/api/school/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) setMessage("Password reset to 1234.");
    else setMessage("Reset failed.");
  }

  return (
    <div className="card overflow-x-auto">
      {message && <div className="alert alert-success mb-3">{message}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.fullName}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button className="btn btn-secondary" onClick={() => reset(u.id)}>
                  Reset
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
