import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return (
    <GenericListPanel
      title="Library — Books & Borrowing"
      api="/api/school/library"
      fields={[
        { name: "Title", key: "title" },
        { name: "Author", key: "author" },
        { name: "Copies", key: "copies", type: "number" },
      ]}
    />
  );
}
