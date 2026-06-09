import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicSchoolHomepage } from "@/lib/school-homepage";
import { SchoolHomepageView } from "@/components/SchoolHomepageView";
import { isValidSchoolCodeFormat } from "@/lib/school-codes";

export default async function PublicSchoolPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = code.padStart(3, "0");
  if (!isValidSchoolCodeFormat(normalized)) notFound();

  const data = await getPublicSchoolHomepage(normalized);
  if (!data) notFound();

  return (
    <>
      <SchoolHomepageView data={data} showLogin />
      <div className="text-center pb-4">
        <Link href="/login" className="text-sm text-slate-500 hover:text-slate-300">
          Matrix IT Solution — Global Login
        </Link>
      </div>
    </>
  );
}
