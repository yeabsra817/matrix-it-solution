import { NextResponse } from "next/server";
import { validateSchoolForLogin } from "@/lib/school-auth";

export async function GET(req: Request) {
  try {
    const raw = new URL(req.url).searchParams.get("code")?.trim() || "";
    const result = await validateSchoolForLogin(raw);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, valid: false, message: result.error, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: "School found",
      code: result.code,
      name: result.name,
    });
  } catch (err) {
    console.error("[validate-school]", err);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        message: "Could not validate school. Please try again.",
        error: "Could not validate school. Please try again.",
      },
      { status: 500 }
    );
  }
}
