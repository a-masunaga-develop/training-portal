import { NextResponse } from "next/server";
import { authorize, errorResponse } from "@/lib/api";
import { listUsers } from "@/lib/repository";

/** GET /api/users : 受講者一覧（管理者のみ） */
export async function GET() {
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    return NextResponse.json(await listUsers());
  } catch (e) {
    return errorResponse(e);
  }
}
