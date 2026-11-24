import { NextResponse, type NextRequest } from "next/server";
import { authorize, errorResponse, scopedUserId } from "@/lib/api";
import { listTestResults } from "@/lib/repository";

/**
 * GET /api/test-results : 受講者は自分の結果、管理者は ?userId= 指定ユーザーまたは全件
 * （受験は POST /api/contents/:contentId/test）
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    return NextResponse.json(await listTestResults(scopedUserId(auth.user, req)));
  } catch (e) {
    return errorResponse(e);
  }
}
