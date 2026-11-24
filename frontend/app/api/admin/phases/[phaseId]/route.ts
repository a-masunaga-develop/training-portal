import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { deletePhase, getPhase, savePhase } from "@/lib/repository";
import { parsePhase } from "@/lib/validation";

type Params = { params: Promise<{ phaseId: string }> };

/** PUT /api/admin/phases/:phaseId : フェーズ更新 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { phaseId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    if (!(await getPhase(phaseId))) {
      return NextResponse.json({ error: "フェーズが見つかりません" }, { status: 404 });
    }
    const parsed = parsePhase(await readJson(req));
    if (parsed.errors) return badRequest(parsed.errors);
    return NextResponse.json(await savePhase(parsed.value, phaseId));
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE /api/admin/phases/:phaseId : フェーズ削除（コンテンツがある場合は不可） */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { phaseId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    await deletePhase(phaseId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
