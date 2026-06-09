"use client";

import { useEffect, useState } from "react";

type RecordRow = {
  userId: string;
  certificateNo: string;
  seniority: string;
  educationLevel: string;
  joiningDate: string;
  user: { fullName: string; email: string; role: string };
};

type StaffUser = { id: string; fullName: string; email: string; role: string };

export function HRExperiencePanel() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [seniority, setSeniority] = useState<"JUNIOR" | "SENIOR">("JUNIOR");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const [r, u] = await Promise.all([
        fetch("/api/school/hr-experience", { credentials: "same-origin" }).then(
          (res) => res.json()
        ),
        fetch("/api/school/users?scope=staff", { credentials: "same-origin" }).then(
          (res) => res.json()
        ),
      ]);
      if (r.error) setError(r.error);
      else setRecords(r.records || []);
      if (!u.users && u.error) setError(u.error);
      else setUsers(u.users || []);
    } catch (err) {
      console.error("[HRExperiencePanel] load failed:", err);
      setError("Could not load staff list.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const body: Record<string, unknown> = {
      userId: form.get("userId"),
      seniority,
      educationLevel: form.get("educationLevel"),
      joiningDate: form.get("joiningDate"),
    };

    if (seniority === "SENIOR") {
      Object.assign(body, {
        previousSchools: form.get("previousSchools"),
        totalYearsExperience: form.get("totalYearsExperience"),
        fullJobHistory: form.get("fullJobHistory"),
        positionsHeld: form.get("positionsHeld"),
        certifications: form.get("certifications"),
        achievements: form.get("achievements"),
        skills: form.get("skills"),
        detailedEducation: form.get("detailedEducation"),
        age: form.get("age"),
      });
    }

    try {
      const res = await fetch("/api/school/hr-experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed");
      else {
        setMessage(`Saved. Certificate: ${data.certificateNo}`);
        e.currentTarget.reset();
        load();
      }
    } catch (err) {
      console.error("[HRExperiencePanel] save failed:", err);
      setError("Could not save experience profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="card space-y-3">
        <h3 className="font-semibold">HR Experience Profile</h3>
        <p className="text-sm text-slate-400">
          Junior = basic profile. Senior = full experience details + PDF certificate.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div>
          <label className="label">Staff Member</label>
          <select className="input" name="userId" required>
            <option value="">Select staff</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} — {u.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Seniority</label>
          <select
            className="input"
            value={seniority}
            onChange={(e) => setSeniority(e.target.value as "JUNIOR" | "SENIOR")}
            required
          >
            <option value="JUNIOR">Junior (basic profile)</option>
            <option value="SENIOR">Senior (full details)</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Education Level</label>
            <input
              className="input"
              name="educationLevel"
              placeholder="Bachelor / Diploma / High School"
              required
            />
          </div>
          <div>
            <label className="label">Joining Date</label>
            <input className="input" type="date" name="joiningDate" required />
          </div>
        </div>

        {seniority === "SENIOR" && (
          <div className="space-y-3 border-t border-[#334155] pt-3">
            <p className="text-sm font-medium text-slate-300">Senior staff — full details</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Age</label>
                <input className="input" name="age" type="number" min={18} max={80} required />
              </div>
              <div>
                <label className="label">Total Years of Experience</label>
                <input className="input" name="totalYearsExperience" required />
              </div>
            </div>
            <div>
              <label className="label">Detailed Educational Background</label>
              <textarea className="input" name="detailedEducation" rows={2} required />
            </div>
            <div>
              <label className="label">Previous Schools Worked</label>
              <textarea className="input" name="previousSchools" rows={2} required />
            </div>
            <div>
              <label className="label">Positions Held</label>
              <textarea className="input" name="positionsHeld" rows={2} required />
            </div>
            <div>
              <label className="label">Full Job History</label>
              <textarea className="input" name="fullJobHistory" rows={3} required />
            </div>
            <div>
              <label className="label">Certifications</label>
              <textarea className="input" name="certifications" rows={2} required />
            </div>
            <div>
              <label className="label">Achievements</label>
              <textarea className="input" name="achievements" rows={2} required />
            </div>
            <div>
              <label className="label">Skills</label>
              <textarea className="input" name="skills" rows={2} required />
            </div>
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save & Enable PDF Certificate"}
        </button>
      </form>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Level</th>
              <th>Joining</th>
              <th>Certificate</th>
              <th>PDF</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.userId}>
                <td>{r.user.fullName}</td>
                <td>{r.user.role}</td>
                <td>
                  <span className="badge">{r.seniority}</span>
                </td>
                <td>{new Date(r.joiningDate).toLocaleDateString()}</td>
                <td>{r.certificateNo}</td>
                <td>
                  <a
                    className="btn btn-secondary"
                    href={`/api/school/hr-certificate?userId=${r.userId}`}
                  >
                    Download PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
