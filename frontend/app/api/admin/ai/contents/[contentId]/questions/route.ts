import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { generateQuestions, MAX_QUESTIONS_PER_CALL } from "@/lib/ai/test-generation";
import { getContent, listTestsByContent } from "@/lib/repository";

/**
 * POST /api/admin/ai/contents/:contentId/questions  { topics, count, avoid? } : 問題を生成（保存はしない）
 * 時間切れを避けるため1回の問題数は MAX_QUESTIONS_PER_CALL まで。画面側で分けて呼び出す。
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const body = await readJson<{ topics?: unknown; count?: unknown; avoid?: unknown }>(req);
  const topics = Array.isArray(body?.topics) ? body.topics.filter((t): t is string => typeof t === "string") : [];
  const avoid = Array.isArray(body?.avoid) ? body.avoid.filter((t): t is string => typeof t === "string") : [];
  const count = typeof body?.count === "number" ? body.count : MAX_QUESTIONS_PER_CALL;
  if (topics.length === 0) return badRequest("学習ポイントを1つ以上指定してください");
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const content = await getContent(contentId);
    if (!content) return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
    const existing = await listTestsByContent(contentId);
    return NextResponse.json(await generateQuestions(content, topics, count, existing, auth.user.userId, avoid));
  } catch (e) {
    return errorResponse(e);
  }
}
