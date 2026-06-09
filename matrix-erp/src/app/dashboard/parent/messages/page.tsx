import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return (
    <GenericListPanel
      title="Message Teacher"
      api="/api/school/messages"
      fields={[
        { name: "Teacher User ID", key: "toUserId" },
        { name: "Subject", key: "subject" },
        { name: "Message", key: "body" },
      ]}
    />
  );
}
