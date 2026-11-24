import { NextResponse } from "next/server";
import { authorize, errorResponse } from "@/lib/api";
import { generateAdminReport } from "@/lib/ai/report";
import { saveJobOutput } from "@/lib/ai/store";

/** POST /api/admin/ai/report : AI 管理レポートを作成し、実行履歴に保存 */
export async function POST() {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const { jobId, report } = await generateAdminReport(auth.user.userId);
    await saveJobOutput(jobId, report);
    return NextResponse.json(report, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
