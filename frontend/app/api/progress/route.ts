import { NextResponse, type NextRequest } from "next/server";
import { authorize, errorResponse, readJson, scopedUserId } from "@/lib/api";
import { completeLesson, getProgress, listProgress } from "@/lib/repository";

/** GET /api/progress : 受講者は自分の進捗、管理者は ?userId= 指定ユーザーまたは全件 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    const userId = scopedUserId(auth.user, req);
    return NextResponse.json(userId ? await getProgress(userId) : await listProgress());
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/progress  { lessonId } : ログイン中ユーザーのレッスンを完了にする */
export async function POST(req: NextRequest) {
  const body = await readJson<{ lessonId?: string }>(req);
  if (!body?.lessonId) {
    return NextResponse.json({ error: "lessonId を指定してください" }, { status: 400 });
  }
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    return NextResponse.json(await completeLesson(auth.user.userId, body.lessonId));
  } catch (e) {
    return errorResponse(e, e instanceof Error && e.message.startsWith("存在しない") ? 400 : 500);
  }
}
