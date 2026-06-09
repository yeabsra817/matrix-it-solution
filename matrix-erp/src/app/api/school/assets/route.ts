import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { hasPermission } from "@/lib/rbac";
import { getSchoolDb } from "@/lib/school-db";
import { logFromSession } from "@/lib/audit";

const schema = z.object({
  name: z.string(),
  serialNo: z.string().optional(),
});

const assignSchema = z.object({
  id: z.string(),
  assignedToUserId: z.string().nullable(),
  action: z.enum(["ASSIGN", "RETURN"]),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!session!.schoolCode) {
    return NextResponse.json({ error: "School context required" }, { status: 400 });
  }
  if (!hasPermission(session!, "manageAssets") && session!.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const db = getSchoolDb(session!.schoolCode!);
  const assets = await db.schoolAsset.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ assets });
}

export async function POST(req: Request) {
  const { session, response } = await requireSession();
  if (response) return response;
  if (!hasPermission(session!, "manageAssets")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const db = getSchoolDb(session!.schoolCode!);

  if (body.action) {
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    if (parsed.data.action === "ASSIGN") {
      await db.schoolAsset.update({
        where: { id: parsed.data.id },
        data: {
          assignedToUserId: parsed.data.assignedToUserId,
          status: "ASSIGNED",
          assignedAt: new Date(),
          returnedAt: null,
        },
      });
    } else {
      await db.schoolAsset.update({
        where: { id: parsed.data.id },
        data: {
          assignedToUserId: null,
          status: "AVAILABLE",
          returnedAt: new Date(),
        },
      });
    }
    await logFromSession(session!, `ASSET_${parsed.data.action}`, "SchoolAsset", parsed.data.id);
    return NextResponse.json({ ok: true });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const asset = await db.schoolAsset.create({ data: parsed.data });
  await logFromSession(session!, "ASSET_CREATE", "SchoolAsset", asset.id);
  return NextResponse.json({ ok: true, id: asset.id });
}
