import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { getContent, saveTranscript } from "@/lib/repository";

/** PUT /api/admin/ai/contents/:contentId/transcript  { transcript } : AI 生成用の字幕・教材テキストを保存 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const body = await readJson<{ transcript?: unknown }>(req);
  if (typeof body?.transcript !== "string") return badRequest("transcript を指定してください");
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    if (!(await getContent(contentId))) {
      return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
    }
    await saveTranscript(contentId, body.transcript.replace(/\r\n/g, "\n").trim());
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
