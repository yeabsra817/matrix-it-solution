import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return <GenericListPanel title="My Assignments" api="/api/school/homework" fields={[]} />;
}
