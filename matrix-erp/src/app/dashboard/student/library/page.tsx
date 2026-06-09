import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return <GenericListPanel title="Library" api="/api/school/library" fields={[]} />;
}
