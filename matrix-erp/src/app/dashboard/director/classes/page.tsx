import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return (
    <GenericListPanel
      title="Class System (KG–10)"
      api="/api/school/classes"
      fields={[
        { name: "Band", key: "gradeBand" },
        { name: "Grade", key: "grade" },
        { name: "Section", key: "section" },
        { name: "Name", key: "name" },
      ]}
    />
  );
}
