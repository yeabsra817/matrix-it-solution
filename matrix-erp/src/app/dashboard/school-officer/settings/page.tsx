import { PasswordChangeForm } from "@/components/PasswordChangeForm";

export default function SchoolOfficerSettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Settings</h2>
      <PasswordChangeForm />
    </div>
  );
}
