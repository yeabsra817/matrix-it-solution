import { CreateUserForm } from "@/components/CreateUserForm";

export default function SchoolAssistantCreatePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create Student or Parent</h2>
      <p className="text-slate-400">
        School Assistant may create STUDENT and PARENT users only.
      </p>
      <CreateUserForm title="Admissions" allowedRoles={["STUDENT", "PARENT"]} />
    </div>
  );
}
