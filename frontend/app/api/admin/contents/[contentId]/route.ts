import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { deleteContent, getContent, saveContent } from "@/lib/repository";
import { parseContent } from "@/lib/validation";

type Params = { params: Promise<{ contentId: string }> };

/** PUT /api/admin/contents/:contentId : コンテンツ更新 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { contentId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    if (!(await getContent(contentId))) {
      return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
    }
    const parsed = parseContent(await readJson(req));
    if (parsed.errors) return badRequest(parsed.errors);
    return NextResponse.json(await saveContent(parsed.value, contentId));
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE /api/admin/contents/:contentId : コンテンツと問題を削除 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { contentId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    await deleteContent(contentId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
