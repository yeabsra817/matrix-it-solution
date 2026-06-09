import { SchoolOfficerPanel } from "@/components/SchoolOfficerPanel";

export default function SchoolOfficerStudentsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Student Registration & Linking</h2>
      <p className="text-slate-400">
        Real-time sync with database. Link students to classes and parents/guardians.
      </p>
      <SchoolOfficerPanel />
    </div>
  );
}
