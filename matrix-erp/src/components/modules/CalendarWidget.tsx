"use client";

import { dualDateLabel } from "@/lib/ethiopian-calendar";

export function CalendarWidget() {
  const now = new Date();
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Ethiopian + Gregorian Calendar</h3>
      <p className="text-lg">{dualDateLabel(now)}</p>
    </div>
  );
}
