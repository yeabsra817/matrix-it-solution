import { NextResponse } from "next/server";
import { getPublicSchoolHomepage } from "@/lib/school-homepage";
import { isValidSchoolCodeFormat } from "@/lib/school-codes";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.trim() || "";
  if (!code || !isValidSchoolCodeFormat(code.padStart(3, "0"))) {
    return NextResponse.json(
      { error: "Valid 3-digit school code required." },
      { status: 400 }
    );
  }

  const data = await getPublicSchoolHomepage(code);
  if (!data) {
    return NextResponse.json({ error: "School not found or inactive." }, { status: 404 });
  }

  return NextResponse.json({ homepage: data });
}
