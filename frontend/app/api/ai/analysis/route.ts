import { NextResponse } from "next/server";
import { authorize, errorResponse } from "@/lib/api";
import { analyzeLearning } from "@/lib/ai/analysis";
import { getRecommendation } from "@/lib/ai/store";
import { getUser } from "@/lib/repository";

/** 受講者が自分で再分析できる間隔（費用を抑えるため） */
const COOLDOWN_MINUTES = 10;

/** GET /api/ai/analysis : 自分の理解度分析・学習推薦の結果 */
export async function GET() {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;
    return NextResponse.json(await getRecommendation(auth.user.userId));
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST /api/ai/analysis : 自分の理解度分析・学習推薦を実行 */
export async function POST() {
  try {
    const auth = await authorize();
    if (auth.response) return auth.response;

    const previous = await getRecommendation(auth.user.userId);
    if (previous && !auth.user.isAdmin) {
      const elapsed = (Date.now() - Date.parse(previous.generatedAt)) / 60_000;
      if (elapsed < COOLDOWN_MINUTES) {
        return NextResponse.json(
          { error: `分析は${COOLDOWN_MINUTES}分に1回まで実行できます。あと${Math.ceil(COOLDOWN_MINUTES - elapsed)}分お待ちください` },
          { status: 429 },
        );
      }
    }

    const user = (await getUser(auth.user.userId)) ?? {
      userId: auth.user.userId,
      name: auth.user.name,
      role: "student" as const,
    };
    return NextResponse.json(await analyzeLearning(user, auth.user.userId));
  } catch (e) {
    return errorResponse(e);
  }
}
