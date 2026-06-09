import { GenericListPanel } from "@/components/modules/GenericListPanel";

export default function StoreManagerPage() {
  return (
    <GenericListPanel
      title="School Assets"
      api="/api/school/assets"
      fields={[
        { name: "Name", key: "name" },
        { name: "Category", key: "category" },
        { name: "Status", key: "status" },
        { name: "Value", key: "value", type: "number" },
      ]}
    />
  );
}
