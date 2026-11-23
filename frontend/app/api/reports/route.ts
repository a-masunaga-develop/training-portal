import { NextResponse, type NextRequest } from "next/server";
import { authorize, errorResponse, readJson, scopedUserId } from "@/lib/api";
import { createReport, listReports, validateReport, type ReportInput } from "@/lib/repository";

/** GET /api/reports : 受講者は自分の日報、管理者は ?userId= 指定ユーザーまたは全件 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    return NextResponse.json(await listReports(scopedUserId(auth.user, req)));
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/reports : ログイン中ユーザーの日報を登録 */
export async function POST(req: NextRequest) {
  const body = await readJson<Partial<ReportInput>>(req);
  const errors = validateReport(body ?? {});
  if (!body || errors.length > 0) {
    return NextResponse.json({ error: errors.join("\n") || "不正なリクエストです" }, { status: 400 });
  }
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    const report = await createReport(auth.user.userId, body as ReportInput);
    return NextResponse.json(report, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
