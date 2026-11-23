import { NextResponse, type NextRequest } from "next/server";
import { authorize, errorResponse } from "@/lib/api";
import { listPublicTests } from "@/lib/repository";

/** GET /api/tests?phase=phase1 : 問題一覧（正解は含めない） */
export async function GET(req: NextRequest) {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    const phase = req.nextUrl.searchParams.get("phase") ?? "phase1";
    return NextResponse.json(await listPublicTests(phase));
  } catch (e) {
    return errorResponse(e);
  }
}
