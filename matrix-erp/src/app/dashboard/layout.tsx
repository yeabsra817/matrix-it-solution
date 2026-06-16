/** Dashboard routes require auth — never prerender at build time. */
export const dynamic = "force-dynamic";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
