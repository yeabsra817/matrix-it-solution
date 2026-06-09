import { PasswordChangeForm } from "@/components/PasswordChangeForm";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Super Admin Settings</h2>
      <PasswordChangeForm />
    </div>
  );
}
