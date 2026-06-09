import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function PurchaserPage() {
  return (
    <GenericListPanel
      title="Purchase Requests"
      api="/api/school/purchases"
      fields={[
        { name: "Title", key: "title" },
        { name: "Items", key: "items" },
        { name: "Amount", key: "amount", type: "number" },
      ]}
    />
  );
}
