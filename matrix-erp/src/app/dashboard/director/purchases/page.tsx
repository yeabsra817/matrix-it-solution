import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return (
    <GenericListPanel
      title="Purchasing — Director Approval"
      api="/api/school/purchases"
      fields={[
        { name: "Title", key: "title" },
        { name: "Items", key: "items" },
        { name: "Amount", key: "amount", type: "number" },
      ]}
    />
  );
}
