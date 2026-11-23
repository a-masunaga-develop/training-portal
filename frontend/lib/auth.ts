import "server-only";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { runWithAmplifyServerContext } from "./amplify-server";
import { getUserByEmail } from "./repository";

/** Cognito のトークンから分かる情報（DynamoDB を参照しない） */
export type SessionClaims = {
  /** Cognito のユーザーID */
  sub: string;
  email: string;
  groups: string[];
  isAdmin: boolean;
};

export type SessionUser = SessionClaims & {
  /** users テーブルの userId（メールアドレスで紐付け。未登録なら Cognito の sub） */
  userId: string;
  name: string;
};

/** ログイン中ユーザーのトークン情報（未ログインなら null）。ヘッダー表示などに使う */
export const getSessionClaims = cache(async (): Promise<SessionClaims | null> => {
  const session = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (ctx) => {
      try {
        return await fetchAuthSession(ctx);
      } catch {
        return null;
      }
    },
  });

  const payload = session?.tokens?.idToken?.payload;
  if (!payload?.sub) return null;

  const rawGroups = payload["cognito:groups"];
  const groups = Array.isArray(rawGroups) ? rawGroups.map(String) : [];
  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : "",
    groups,
    isAdmin: groups.includes("admin"),
  };
});

/** ログイン中のユーザー（users テーブルと紐付け済み）。未ログインなら null */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const record = claims.email ? await getUserByEmail(claims.email) : null;
  return {
    ...claims,
    userId: record?.userId ?? claims.sub,
    name: record?.name ?? claims.email,
  };
});

/** ページ用：未ログインなら /login へリダイレクト */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
