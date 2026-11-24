import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import type { z } from "zod/v4";
import { finishJob, startJob, type AiJobType } from "./store";

/** 利用モデル（環境変数で変更可能） */
export const AI_MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-5-5";

/** API キーを保管している SSM パラメータ名（本番用） */
const API_KEY_PARAMETER = process.env.CLAUDE_API_KEY_PARAMETER;

/** AI 機能が使える設定になっているか（ローカルは .env.local のキー、本番は SSM） */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || API_KEY_PARAMETER);
}

/** 画面に表示するエラー（API では 502 / 503 で返す） */
export class AiError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "AiError";
  }
}

let clientPromise: Promise<Anthropic> | null = null;

async function loadApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  if (!API_KEY_PARAMETER) {
    throw new AiError("Claude API キーが設定されていません（管理画面の AI 設定を確認してください）", 503);
  }
  const ssm = new SSMClient({ region: process.env.APP_REGION ?? process.env.AWS_REGION ?? "ap-northeast-1" });
  const res = await ssm.send(new GetParameterCommand({ Name: API_KEY_PARAMETER, WithDecryption: true }));
  const value = res.Parameter?.Value;
  if (!value) throw new AiError("SSM パラメータから Claude API キーを取得できませんでした", 503);
  return value;
}

/** Claude クライアント（API キーは初回だけ取得してキャッシュする） */
function getClient(): Promise<Anthropic> {
  clientPromise ??= loadApiKey()
    .then((apiKey) => new Anthropic({ apiKey, timeout: 120_000, maxRetries: 1 }))
    .catch((e) => {
      clientPromise = null; // 次回は再取得する
      throw e;
    });
  return clientPromise;
}

function toAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof Anthropic.AuthenticationError) {
    return new AiError("Claude API キーが無効です。設定を確認してください", 503);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AiError("AI の利用が混み合っています。しばらく待ってから再度お試しください", 429);
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AiError("AI の応答がタイムアウトしました。もう一度お試しください", 504);
  }
  if (error instanceof Anthropic.APIError) {
    return new AiError(`AI の呼び出しに失敗しました（${error.status ?? "接続エラー"}）`, 502);
  }
  if (error instanceof Error && error.name === "ParameterNotFound") {
    return new AiError("SSM パラメータが見つかりません。AI 設定を確認してください", 503);
  }
  if (error instanceof Error && error.name === "AccessDeniedException") {
    return new AiError("SSM パラメータを読み取る権限がありません。IAM の設定を確認してください", 503);
  }
  return new AiError("AI の呼び出しに失敗しました", 502);
}

type RunOptions<S extends z.ZodType> = {
  job: { type: AiJobType; requestedBy: string; contentId?: string; userId?: string };
  system: string;
  prompt: string;
  schema: S;
  /** 思考の深さ（Claude Opus 5.5 の既定は medium） */
  effort: "low" | "medium" | "high";
};

/**
 * Claude を1回呼び出し、スキーマどおりの JSON を受け取る。
 * 実行履歴（トークン数・成否）は ai_generation_jobs に記録する。
 */
export async function runStructured<S extends z.ZodType>(
  options: RunOptions<S>,
): Promise<{ jobId: string; output: z.infer<S> }> {
  const job = await startJob({ ...options.job, model: AI_MODEL });

  try {
    const client = await getClient();
    const response = await client.beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      system: options.system,
      messages: [{ role: "user", content: options.prompt }],
      output_config: { effort: options.effort, format: betaZodOutputFormat(options.schema) },
      // 安全分類器に拒否された場合は、推奨モデルで自動的にやり直す
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    const usage = { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens };

    if (response.stop_reason === "refusal") {
      throw Object.assign(new AiError("AI がこの内容の処理を断りました。入力内容を見直してください"), { usage });
    }
    if (response.stop_reason === "max_tokens") {
      throw Object.assign(new AiError("AI の出力が長すぎて途中で終わりました。入力を短くしてお試しください"), { usage });
    }
    const output = response.parsed_output;
    if (output === null || output === undefined) {
      throw Object.assign(new AiError("AI の出力を読み取れませんでした。もう一度お試しください"), { usage });
    }

    await finishJob(job, { status: "completed", ...usage, output });
    return { jobId: job.jobId, output: output as z.infer<S> };
  } catch (error) {
    const aiError = toAiError(error);
    const usage = (error as { usage?: { inputTokens: number; outputTokens: number } }).usage;
    if (!(error instanceof AiError)) console.error(error);
    await finishJob(job, { status: "failed", error: aiError.message, ...usage }).catch(() => {});
    throw aiError;
  }
}
