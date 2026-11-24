import "server-only";
import { GetCommand, PutCommand, ScanCommand, UpdateCommand, type ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb, TABLES } from "../dynamodb";

export type AiJobType = "topic_extraction" | "test_generation" | "learning_analysis" | "admin_report";

export const AI_JOB_TYPE_LABELS: Record<AiJobType, string> = {
  topic_extraction: "学習ポイント抽出",
  test_generation: "テスト生成",
  learning_analysis: "理解度分析・学習推薦",
  admin_report: "管理レポート",
};

export type AiJob = {
  jobId: string;
  type: AiJobType;
  status: "running" | "completed" | "failed";
  model: string;
  /** 実行した管理者・受講者の userId */
  requestedBy: string;
  contentId?: string;
  /** 分析対象の受講者 */
  userId?: string;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  /** AI の出力（管理レポートなど、後から表示するもの） */
  output?: unknown;
  createdAt: string;
  completedAt?: string;
};

export async function startJob(input: Pick<AiJob, "type" | "model" | "requestedBy" | "contentId" | "userId">): Promise<AiJob> {
  const job: AiJob = {
    ...input,
    jobId: `job-${randomUUID()}`,
    status: "running",
    createdAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: TABLES.aiJobs, Item: job }));
  return job;
}

export async function finishJob(
  job: AiJob,
  result: Pick<AiJob, "status" | "inputTokens" | "outputTokens" | "error" | "output">,
): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLES.aiJobs,
      Item: { ...job, ...result, completedAt: new Date().toISOString() },
    }),
  );
}

/** 実行履歴に、画面表示用に加工した出力を保存し直す（管理レポートなど） */
export async function saveJobOutput(jobId: string, output: unknown): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.aiJobs,
      Key: { jobId },
      UpdateExpression: "SET #o = :o",
      ExpressionAttributeNames: { "#o": "output" },
      ExpressionAttributeValues: { ":o": output },
    }),
  );
}

async function scanAll<T>(input: ScanCommandInput): Promise<T[]> {
  const items: T[] = [];
  let key: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(new ScanCommand({ ...input, ExclusiveStartKey: key }));
    items.push(...((res.Items ?? []) as T[]));
    key = res.LastEvaluatedKey;
  } while (key);
  return items;
}

/** 実行履歴（新しい順）。since を指定するとその日時以降のみ */
export async function listJobs(options: { type?: AiJobType; since?: string } = {}): Promise<AiJob[]> {
  const filters: string[] = [];
  const values: Record<string, unknown> = {};
  if (options.type) {
    filters.push("#t = :t");
    values[":t"] = options.type;
  }
  if (options.since) {
    filters.push("createdAt >= :s");
    values[":s"] = options.since;
  }
  const jobs = await scanAll<AiJob>({
    TableName: TABLES.aiJobs,
    ...(filters.length
      ? {
          FilterExpression: filters.join(" AND "),
          ExpressionAttributeValues: values,
          ...(options.type ? { ExpressionAttributeNames: { "#t": "type" } } : {}),
        }
      : {}),
  });
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------- recommendations（理解度分析・学習推薦の結果） ---------- */

export type UnderstandingLevel = "understood" | "partial" | "weak" | "not_started";

export const UNDERSTANDING_LEVEL_LABELS: Record<UnderstandingLevel, string> = {
  understood: "理解済み",
  partial: "もう少し",
  weak: "理解不足",
  not_started: "未学習",
};

export type Recommendation = {
  userId: string;
  jobId: string;
  generatedAt: string;
  summary: string;
  understanding: { contentId: string; level: UnderstandingLevel; comment: string }[];
  weaknesses: string[];
  /** 推奨コンテンツの contentId（計画書の recommendedContents） */
  recommendedContents: string[];
  recommendations: { contentId: string; reason: string }[];
  advice: string;
};

export async function getRecommendation(userId: string): Promise<Recommendation | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.recommendations, Key: { userId } }));
  return (res.Item as Recommendation | undefined) ?? null;
}

export async function listRecommendations(): Promise<Recommendation[]> {
  return scanAll<Recommendation>({ TableName: TABLES.recommendations });
}

export async function saveRecommendation(rec: Recommendation): Promise<void> {
  await ddb.send(new PutCommand({ TableName: TABLES.recommendations, Item: rec }));
}
