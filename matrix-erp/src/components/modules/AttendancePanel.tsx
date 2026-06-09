"use client";

import { useState } from "react";
import { ModuleFrame } from "./ModuleFrame";

export function AttendancePanel() {
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<{ studentId: string; name: string; status: string }[]>([]);
  const [dateLabel, setDateLabel] = useState("");

  async function load() {
    if (!classId) return;
    const res = await fetch(`/api/school/attendance?classId=${classId}&date=${date}`);
    const d = await res.json();
    setStudents(d.students || []);
    setDateLabel(d.dateLabel || "");
  }

  async function save() {
    await fetch("/api/school/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, date, records: students.map((s) => ({ studentId: s.studentId, status: s.status })) }),
    });
    load();
  }

  return (
    <ModuleFrame title="Attendance — Auto Student List">
      <div className="card flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Class ID" value={classId} onChange={(e) => setClassId(e.target.value)} />
        <input className="input max-w-xs" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn btn-secondary" type="button" onClick={load}>Load Students</button>
      </div>
      {dateLabel && <p className="text-sm text-slate-400">{dateLabel}</p>}
      <div className="card space-y-2">
        {students.map((s, i) => (
          <div key={s.studentId} className="flex justify-between gap-2">
            <span>{s.name}</span>
            <select
              className="input max-w-[120px]"
              value={s.status}
              onChange={(e) => {
                const copy = [...students];
                copy[i] = { ...s, status: e.target.value };
                setStudents(copy);
              }}
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
            </select>
          </div>
        ))}
      </div>
      {students.length > 0 && (
        <button className="btn btn-primary" type="button" onClick={save}>Save Attendance</button>
      )}
    </ModuleFrame>
  );
}
