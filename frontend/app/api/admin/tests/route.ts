import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { listAllTests, listTestsByContent, saveTest } from "@/lib/repository";
import { parseTest } from "@/lib/validation";

/** GET /api/admin/tests?contentId= : 問題一覧（正解を含む） */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const contentId = req.nextUrl.searchParams.get("contentId");
    return NextResponse.json(contentId ? await listTestsByContent(contentId) : await listAllTests());
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/admin/tests : 問題登録 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const parsed = parseTest(await readJson(req));
    if (parsed.errors) return badRequest(parsed.errors);
    return NextResponse.json(await saveTest(parsed.value), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
