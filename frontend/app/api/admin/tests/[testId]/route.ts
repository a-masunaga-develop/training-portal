import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { deleteTest, getTest, saveTest } from "@/lib/repository";
import { parseTest } from "@/lib/validation";

type Params = { params: Promise<{ testId: string }> };

/** PUT /api/admin/tests/:testId : 問題更新 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { testId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    if (!(await getTest(testId))) {
      return NextResponse.json({ error: "問題が見つかりません" }, { status: 404 });
    }
    const parsed = parseTest(await readJson(req));
    if (parsed.errors) return badRequest(parsed.errors);
    return NextResponse.json(await saveTest(parsed.value, testId));
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE /api/admin/tests/:testId : 問題削除 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { testId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    await deleteTest(testId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
