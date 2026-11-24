import { NextResponse, type NextRequest } from "next/server";
import { badRequest, errorResponse, readJson } from "@/lib/api";
import { authorizeContent } from "@/lib/content-api";
import { advanceStatus } from "@/lib/repository";

/** POST /api/contents/:contentId/status  { status: "learning" | "testing" } : 受講状態を進める */
export async function POST(req: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const body = await readJson<{ status?: string }>(req);
  if (body?.status !== "learning" && body?.status !== "testing") {
    return badRequest("status は learning または testing を指定してください");
  }
  try {
    const auth = await authorizeContent(contentId);
    if (auth.response) return auth.response;
    return NextResponse.json(await advanceStatus(auth.user.userId, contentId, body.status));
  } catch (e) {
    return errorResponse(e);
  }
}
