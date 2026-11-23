import { fetchAuthSession } from "aws-amplify/auth/server";
import { NextResponse, type NextRequest } from "next/server";
import { runWithAmplifyServerContext } from "@/lib/amplify-server";

/**
 * 認証ガード
 * - 未ログイン：画面は /login へリダイレクト、API は 401
 * - /admin は admin グループのみ（それ以外は 403 画面）
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const session = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (ctx) => {
      try {
        return await fetchAuthSession(ctx);
      } catch {
        return null;
      }
    },
  });

  const idToken = session?.tokens?.idToken;
  const { pathname, search } = request.nextUrl;

  if (!idToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "ログインしてください" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const rawGroups = idToken.payload["cognito:groups"];
  const groups = Array.isArray(rawGroups) ? rawGroups.map(String) : [];
  if (pathname.startsWith("/admin") && !groups.includes("admin")) {
    return NextResponse.rewrite(new URL("/forbidden", request.url), { status: 403 });
  }

  // トークンが更新された場合は Set-Cookie を含む response を返す
  return response;
}

export const config = {
  // ログイン画面と静的ファイル以外のすべてを保護する
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp)$).*)"],
};
