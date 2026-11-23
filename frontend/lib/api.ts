import { NextResponse } from "next/server";

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

/** Route Handler 共通のエラーレスポンス */
export function errorResponse(error: unknown, status = 500) {
  console.error(error);
  return NextResponse.json({ error: toMessage(error) }, { status });
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
