import { GenericListPanel } from "@/components/modules/GenericListPanel";
export default function Page() {
  return (
    <GenericListPanel
      title="Parent ↔ Teacher Messages"
      api="/api/school/messages"
      fields={[
        { name: "To User ID", key: "toUserId" },
        { name: "Subject", key: "subject" },
        { name: "Message", key: "body" },
      ]}
    />
  );
}
