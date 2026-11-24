import { NextResponse, type NextRequest } from "next/server";
import { authorize, errorResponse } from "@/lib/api";
import { extractTopics } from "@/lib/ai/test-generation";
import { getContent } from "@/lib/repository";

/** POST /api/admin/ai/contents/:contentId/topics : 教材から学習ポイントを抽出 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const content = await getContent(contentId);
    if (!content) return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
    return NextResponse.json(await extractTopics(content, auth.user.userId));
  } catch (e) {
    return errorResponse(e);
  }
}
