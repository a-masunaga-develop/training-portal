import { NextResponse } from "next/server";
import { badRequest, errorResponse } from "@/lib/api";
import { authorizeContent } from "@/lib/content-api";
import { completeContent, listTestsByContent } from "@/lib/repository";

/** POST /api/contents/:contentId/complete : テストのないコンテンツを完了にする */
export async function POST(_req: Request, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  try {
    const auth = await authorizeContent(contentId);
    if (auth.response) return auth.response;

    const tests = await listTestsByContent(contentId);
    if (tests.length > 0) {
      return badRequest("このコンテンツはテストに合格すると完了になります");
    }
    return NextResponse.json(await completeContent(auth.user.userId, contentId));
  } catch (e) {
    return errorResponse(e);
  }
}
