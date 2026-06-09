import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("PARENT", [
  { href: "/dashboard/parent", label: "My Children" },
  { href: "/dashboard/parent/messages", label: "Messages" },
  { href: "/dashboard/parent/marks", label: "Child Marks" },
  { href: "/dashboard/parent/evaluate", label: "Evaluate Teachers" },
  { href: "/dashboard/parent/settings", label: "Settings" },
]);
