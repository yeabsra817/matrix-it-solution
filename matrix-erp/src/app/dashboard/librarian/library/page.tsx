import { GenericListPanel } from "@/components/modules/GenericListPanel";

export default function Page() {
  return (
    <GenericListPanel
      title="Library Inventory"
      api="/api/school/library"
      fields={[
        { name: "Title", key: "title" },
        { name: "Author", key: "author" },
      ]}
    />
  );
}
