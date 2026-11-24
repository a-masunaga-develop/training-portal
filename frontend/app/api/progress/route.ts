import { NextResponse, type NextRequest } from "next/server";
import { authorize, errorResponse, scopedUserId } from "@/lib/api";
import { listAllProgress, listUserProgress } from "@/lib/repository";

/** GET /api/progress : 受講者は自分の進捗、管理者は ?userId= 指定ユーザーまたは全件（コンテンツ単位） */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    const userId = scopedUserId(auth.user, req);
    return NextResponse.json(userId ? await listUserProgress(userId) : await listAllProgress());
  } catch (e) {
    return errorResponse(e);
  }
}
