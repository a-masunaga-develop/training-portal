import { NextResponse, type NextRequest } from "next/server";
import { badRequest, errorResponse, readJson } from "@/lib/api";
import { authorizeContent } from "@/lib/content-api";
import { submitTest } from "@/lib/repository";

/** POST /api/contents/:contentId/test  { answers: { [testId]: 選択肢index } } : 採点して結果・進捗を保存 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const body = await readJson<{ answers?: Record<string, unknown> }>(req);
  if (!body?.answers || typeof body.answers !== "object") {
    return badRequest("answers を指定してください");
  }
  const answers: Record<string, number> = {};
  for (const [testId, value] of Object.entries(body.answers)) {
    if (Number.isInteger(value)) answers[testId] = value as number;
  }
  try {
    const auth = await authorizeContent(contentId);
    if (auth.response) return auth.response;
    const result = await submitTest(auth.user.userId, auth.access.content, answers);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
