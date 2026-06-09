"use client";

import { useState } from "react";
import { ModuleFrame, useApi } from "./ModuleFrame";
import { CURRENT_PMS_PERIOD } from "@/lib/constants";

type MarkRow = {
  studentId: string;
  subjectId: string;
  period: string;
  totalScore: number;
  student?: { user?: { fullName: string } };
  subject?: { name: string };
};

type ClassOption = {
  id: string;
  name: string;
  enrollments: { student: { id: string; user: { fullName: string } } }[];
  classSubjects: { subject: { id: string; name: string } }[];
};

export function MarksPanel() {
  const { data, error, reload } = useApi<{
    marks: MarkRow[];
    subjects: { id: string; name: string }[];
    classes: ClassOption[];
  }>("/api/school/marks");
  const [msg, setMsg] = useState("");
  const [classId, setClassId] = useState("");

  const selectedClass = data?.classes?.find((c) => c.id === classId);
  const students =
    selectedClass?.enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.user.fullName,
    })) ?? [];
  const subjects =
    selectedClass?.classSubjects.map((cs) => cs.subject) ??
    data?.subjects ??
    [];

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    const f = new FormData(e.currentTarget);
    const assignment = Number(f.get("assignment"));
    const exam = Number(f.get("exam"));
    const final = Number(f.get("final"));

    if ([assignment, exam, final].some((n) => Number.isNaN(n))) {
      setMsg("Enter valid numbers for all score fields.");
      return;
    }

    const res = await fetch("/api/school/marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        studentId: f.get("studentId"),
        subjectId: f.get("subjectId"),
        period: f.get("period") || CURRENT_PMS_PERIOD,
        assignmentScore: assignment,
        examScore: exam,
        finalScore: final,
      }),
    });
    const d = await res.json();
    setMsg(res.ok ? `Saved. Total: ${d.totalScore}%` : d.error || "Save failed");
    if (res.ok) reload();
  }

  return (
    <ModuleFrame title="Mark System (30% + 30% + 40%)">
      {error && <div className="alert alert-error">{error}</div>}
      <p className="text-sm text-slate-400">
        Enter scores 0–100 for each component. No duplicate marks per student/subject/period.
      </p>
      <form onSubmit={save} className="card space-y-3">
        {data?.classes && data.classes.length > 0 && (
          <div>
            <label className="label">Class</label>
            <select
              className="input"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            >
              <option value="">Select class</option>
              {data.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Student</label>
            {students.length > 0 ? (
              <select className="input" name="studentId" required>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <input className="input" name="studentId" placeholder="Student profile ID" required />
            )}
          </div>
          <div>
            <label className="label">Subject</label>
            {subjects.length > 0 ? (
              <select className="input" name="subjectId" required>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            ) : (
              <input className="input" name="subjectId" placeholder="Subject ID" required />
            )}
          </div>
        </div>
        <input
          className="input"
          name="period"
          placeholder={`Period (${CURRENT_PMS_PERIOD})`}
          defaultValue={CURRENT_PMS_PERIOD}
        />
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            className="input"
            name="assignment"
            type="number"
            min={0}
            max={100}
            step="any"
            placeholder="Assignment %"
            required
          />
          <input
            className="input"
            name="exam"
            type="number"
            min={0}
            max={100}
            step="any"
            placeholder="Exam %"
            required
          />
          <input
            className="input"
            name="final"
            type="number"
            min={0}
            max={100}
            step="any"
            placeholder="Final %"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit">
          Save Marks
        </button>
      </form>
      {msg && (
        <p className={msg.includes("Saved") ? "text-green-400 text-sm" : "text-red-300 text-sm"}>
          {msg}
        </p>
      )}
      <div className="card overflow-x-auto">
        <table className="table text-sm">
          <thead>
            <tr>
              <th>Student</th>
              <th>Subject</th>
              <th>Period</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(data?.marks ?? []).map((m) => (
              <tr key={`${m.studentId}-${m.subjectId}-${m.period}`}>
                <td>{m.student?.user?.fullName ?? m.studentId}</td>
                <td>{m.subject?.name ?? m.subjectId}</td>
                <td>{m.period}</td>
                <td>{m.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleFrame>
  );
}
