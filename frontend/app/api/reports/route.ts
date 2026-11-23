import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/api";
import { CURRENT_USER_ID } from "@/lib/constants";
import { createReport, listReports, validateReport, type ReportInput } from "@/lib/repository";

/** GET /api/reports?userId=u001 （userId 省略時は全件） */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    return NextResponse.json(await listReports(userId));
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/reports : 日報登録 */
export async function POST(req: NextRequest) {
  const body = await readJson<Partial<ReportInput>>(req);
  const errors = validateReport(body ?? {});
  if (!body || errors.length > 0) {
    return NextResponse.json({ error: errors.join("\n") || "不正なリクエストです" }, { status: 400 });
  }
  try {
    const report = await createReport(CURRENT_USER_ID, body as ReportInput);
    return NextResponse.json(report, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
