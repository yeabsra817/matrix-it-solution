"use client";

import { ModuleFrame } from "./ModuleFrame";

export function ReportsPanel() {
  return (
    <ModuleFrame title="Reports — PDF & Excel Export">
      <div className="card flex flex-wrap gap-3">
        {(["users", "marks", "attendance"] as const).map((type) => (
          <div key={type} className="flex gap-2">
            <a className="btn btn-primary" href={`/api/school/reports?type=${type}&format=pdf`}>
              {type} PDF
            </a>
            <a className="btn btn-secondary" href={`/api/school/reports?type=${type}&format=csv`}>
              {type} Excel
            </a>
          </div>
        ))}
      </div>
    </ModuleFrame>
  );
}
