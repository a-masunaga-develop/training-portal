import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { listContents, saveContent } from "@/lib/repository";
import { parseContent } from "@/lib/validation";

/** GET /api/admin/contents : コンテンツ一覧（非公開を含む） */
export async function GET() {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    return NextResponse.json(await listContents());
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/admin/contents : コンテンツ登録 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const parsed = parseContent(await readJson(req));
    if (parsed.errors) return badRequest(parsed.errors);
    return NextResponse.json(await saveContent(parsed.value), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
