import { NextResponse } from "next/server";
import { authorize, errorResponse } from "@/lib/api";
import { analyzeLearning } from "@/lib/ai/analysis";
import { getUser } from "@/lib/repository";

/** POST /api/admin/ai/analysis/:userId : 管理者が受講者の理解度分析・学習推薦を実行 */
export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    const user = await getUser(userId);
    if (!user) return NextResponse.json({ error: "受講者が見つかりません" }, { status: 404 });
    return NextResponse.json(await analyzeLearning(user, auth.user.userId));
  } catch (e) {
    return errorResponse(e);
  }
}
