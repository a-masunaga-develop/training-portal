import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/api";
import { CURRENT_USER_ID } from "@/lib/constants";
import { completeLesson, getProgress, listProgress } from "@/lib/repository";

/** GET /api/progress?userId=u001 （userId 省略時は全件） */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    return NextResponse.json(userId ? await getProgress(userId) : await listProgress());
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/progress  { lessonId } : レッスンを完了にする */
export async function POST(req: NextRequest) {
  const body = await readJson<{ lessonId?: string }>(req);
  if (!body?.lessonId) {
    return NextResponse.json({ error: "lessonId を指定してください" }, { status: 400 });
  }
  try {
    return NextResponse.json(await completeLesson(CURRENT_USER_ID, body.lessonId));
  } catch (e) {
    return errorResponse(e, e instanceof Error && e.message.startsWith("存在しない") ? 400 : 500);
  }
}
