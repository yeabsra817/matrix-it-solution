import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return (
    <GenericListPanel
      title="Class Assignments"
      api="/api/school/homework"
      fields={[
        { name: "Class ID", key: "classId" },
        { name: "Title", key: "title" },
        { name: "Description", key: "description" },
        { name: "Due Date", key: "dueDate" },
      ]}
    />
  );
}
