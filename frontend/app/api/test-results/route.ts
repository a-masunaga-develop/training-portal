import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, readJson } from "@/lib/api";
import { CURRENT_PHASE, CURRENT_USER_ID } from "@/lib/constants";
import { gradeAndSave, listTestResults } from "@/lib/repository";

/** GET /api/test-results?userId=u001 （userId 省略時は全件） */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    return NextResponse.json(await listTestResults(userId));
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/test-results  { answers: { [testId]: 選択肢index } } : 採点して保存 */
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
    const result = await gradeAndSave(CURRENT_USER_ID, body.phase ?? CURRENT_PHASE, answers);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
