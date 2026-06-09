import { SchoolHomepageEditor } from "./SchoolHomepageEditor";

export default function SchoolHomepagePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">School Homepage</h2>
      <p className="text-slate-400">Manage your school portal homepage content.</p>
      <SchoolHomepageEditor />
    </div>
  );
}
