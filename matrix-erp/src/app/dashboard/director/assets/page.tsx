import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return (
    <GenericListPanel
      title="Asset Management"
      api="/api/school/assets"
      fields={[
        { name: "Asset Name", key: "name" },
        { name: "Serial", key: "serialNo" },
      ]}
    />
  );
}
