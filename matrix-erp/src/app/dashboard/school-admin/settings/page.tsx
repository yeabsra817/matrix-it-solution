import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { SchoolHomepageEditor } from "../homepage/SchoolHomepageEditor";

export default function SchoolAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">School Settings</h2>
      <SchoolHomepageEditor />
      <PasswordChangeForm />
    </div>
  );
}
