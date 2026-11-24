import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, type SessionUser } from "./auth";

type AuthResult = { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse };

/** Route Handler 用：ログイン必須（adminOnly なら管理者のみ） */
export async function authorize(options: { adminOnly?: boolean } = {}): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return { response: NextResponse.json({ error: "ログインしてください" }, { status: 401 }) };
  }
  if (options.adminOnly && !user.isAdmin) {
    return { response: NextResponse.json({ error: "アクセス権限がありません" }, { status: 403 }) };
  }
  return { user };
}

/**
 * 一覧取得の対象ユーザー
 * - 受講者：常に自分自身
 * - 管理者：?userId= の指定があればそのユーザー、なければ全員（undefined）
 */
export function scopedUserId(user: SessionUser, req: NextRequest): string | undefined {
  if (!user.isAdmin) return user.userId;
  return req.nextUrl.searchParams.get("userId") ?? undefined;
}

function toMessage(error: unknown): string {
  if (!(error instanceof Error)) return "サーバーエラーが発生しました";
  if (error.name === "ResourceNotFoundException") {
    return "テーブルが見つかりません。infrastructure/dynamodb/init.sh を実行してください";
  }
  const code = (error as Error & { code?: string }).code;
  if (code === "ECONNREFUSED" || error.name === "AggregateError") {
    return "DynamoDB Local に接続できません。docker compose up -d を実行してください";
  }
  return error.message || "サーバーエラーが発生しました";
}

/** Route Handler 共通のエラーレスポンス（入力エラーは 400） */
export function errorResponse(error: unknown, status = 500) {
  if (error instanceof Error && error.name === "InputError") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: toMessage(error) }, { status });
}

export function badRequest(errors: string[] | string) {
  return NextResponse.json(
    { error: Array.isArray(errors) ? errors.join("\n") : errors },
    { status: 400 },
  );
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
