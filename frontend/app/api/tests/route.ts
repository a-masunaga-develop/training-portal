import { NextResponse, type NextRequest } from "next/server";
import { errorResponse } from "@/lib/api";
import { listPublicTests } from "@/lib/repository";

/** GET /api/tests?phase=phase1 : 問題一覧（正解は含めない） */
export async function GET(req: NextRequest) {
  try {
    const phase = req.nextUrl.searchParams.get("phase") ?? "phase1";
    return NextResponse.json(await listPublicTests(phase));
  } catch (e) {
    return errorResponse(e);
  }
}
