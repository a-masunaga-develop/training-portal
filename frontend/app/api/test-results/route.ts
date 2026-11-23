import { NextResponse, type NextRequest } from "next/server";
import { authorize, errorResponse, readJson, scopedUserId } from "@/lib/api";
import { CURRENT_PHASE } from "@/lib/constants";
import { gradeAndSave, listTestResults } from "@/lib/repository";

/** GET /api/test-results : 受講者は自分の結果、管理者は ?userId= 指定ユーザーまたは全件 */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    return NextResponse.json(await listTestResults(scopedUserId(auth.user, req)));
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/test-results  { answers: { [testId]: 選択肢index } } : 採点してログイン中ユーザーの結果として保存 */
export async function POST(req: NextRequest) {
  const body = await readJson<{ phase?: string; answers?: Record<string, unknown> }>(req);
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers を指定してください" }, { status: 400 });
  }
  const answers: Record<string, number> = {};
  for (const [testId, value] of Object.entries(body.answers)) {
    if (Number.isInteger(value)) answers[testId] = value as number;
  }
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    const result = await gradeAndSave(auth.user.userId, body.phase ?? CURRENT_PHASE, answers);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
