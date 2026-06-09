import { SchoolOfficerPanel } from "@/components/SchoolOfficerPanel";

export default function SchoolAssistantStudentsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Admissions — Students & Parents</h2>
      <p className="text-slate-400">
        Create STUDENT and PARENT users only. All actions validated server-side.
      </p>
      <SchoolOfficerPanel />
    </div>
  );
}
