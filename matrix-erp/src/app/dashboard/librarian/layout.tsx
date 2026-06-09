import { makeRoleLayout } from "@/lib/role-pages";

export default makeRoleLayout("LIBRARIAN", [
  { href: "/dashboard/librarian", label: "Library" },
  { href: "/dashboard/librarian/library", label: "Books" },
  { href: "/dashboard/librarian/settings", label: "Settings" },
]);
