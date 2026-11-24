import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { listPhases, savePhase } from "@/lib/repository";
import { parsePhase } from "@/lib/validation";

/** GET /api/admin/phases : フェーズ一覧（非公開を含む） */
export async function GET() {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    return NextResponse.json(await listPhases());
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/admin/phases : フェーズ登録 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const parsed = parsePhase(await readJson(req));
    if (parsed.errors) return badRequest(parsed.errors);
    return NextResponse.json(await savePhase(parsed.value), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
