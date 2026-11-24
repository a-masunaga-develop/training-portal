import "server-only";
import { NextResponse } from "next/server";
import { authorize } from "./api";
import { checkContentAccess, type ContentAccess } from "./curriculum";
import type { SessionUser } from "./auth";

type Ok = { user: SessionUser; access: Extract<ContentAccess, { ok: true }>; response?: undefined };
type Ng = { response: NextResponse; user?: undefined; access?: undefined };

/** 受講者用 API：ログインしていて、そのコンテンツを受講できるか確認する */
export async function authorizeContent(contentId: string): Promise<Ok | Ng> {
  const auth = await authorize();
  if (auth.response) return { response: auth.response };

  const access = await checkContentAccess(auth.user, contentId);
  if (!access.ok) {
    return {
      response:
        access.reason === "locked"
          ? NextResponse.json({ error: "前のコンテンツを完了すると受講できます" }, { status: 403 })
          : NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 }),
    };
  }
  return { user: auth.user, access };
}
