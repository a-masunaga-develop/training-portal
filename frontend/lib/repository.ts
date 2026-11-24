import "server-only";
import {
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  type QueryCommandInput,
  type ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb, TABLES } from "./dynamodb";
import type {
  Content,
  ContentProgress,
  Phase,
  ProgressStatus,
  PublicTest,
  Report,
  Test,
  TestResult,
  User,
} from "./types";

/* ---------- 共通 ---------- */

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

async function queryAll<T>(input: QueryCommandInput): Promise<T[]> {
  const items: T[] = [];
  let key: Record<string, unknown> | undefined;
  do {
    const res = await ddb.send(new QueryCommand({ ...input, ExclusiveStartKey: key }));
    items.push(...((res.Items ?? []) as T[]));
    key = res.LastEvaluatedKey;
  } while (key);
  return items;
}

function byUser(userId?: string): Partial<ScanCommandInput> {
  return userId
    ? { FilterExpression: "userId = :u", ExpressionAttributeValues: { ":u": userId } }
    : {};
}

function newId(prefix: string): string {
  return `${prefix}${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

/** 入力エラー（API では 400 で返す） */
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

/* ---------- users ---------- */

export async function listUsers(): Promise<User[]> {
  const users = await scanAll<User>({ TableName: TABLES.users });
  return users.sort((a, b) => a.userId.localeCompare(b.userId));
}

export async function getUser(userId: string): Promise<User | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.users, Key: { userId } }));
  return (res.Item as User | undefined) ?? null;
}

/** Cognito のメールアドレスから users を検索する（大文字小文字は区別しない） */
export async function getUserByEmail(email: string): Promise<User | null> {
  const target = email.trim().toLowerCase();
  const users = await scanAll<User>({
    TableName: TABLES.users,
    FilterExpression: "attribute_exists(email)",
  });
  return users.find((u) => u.email?.toLowerCase() === target) ?? null;
}

/* ---------- reports ---------- */

export async function listReports(userId?: string): Promise<Report[]> {
  const reports = await scanAll<Report>({ TableName: TABLES.reports, ...byUser(userId) });
  return reports.sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export type ReportInput = Pick<Report, "date" | "hours" | "content" | "understanding" | "comment">;

export function validateReport(input: Partial<ReportInput>): string[] {
  const errors: string[] = [];
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push("学習日を入力してください");
  }
  if (typeof input.hours !== "number" || !(input.hours > 0 && input.hours <= 24)) {
    errors.push("学習時間は0より大きく24以下で入力してください");
  }
  if (!input.content?.trim()) {
    errors.push("学習内容を入力してください");
  }
  if (typeof input.understanding !== "number" || ![1, 2, 3, 4, 5].includes(input.understanding)) {
    errors.push("理解度は1〜5で選択してください");
  }
  return errors;
}

export async function createReport(userId: string, input: ReportInput): Promise<Report> {
  const report: Report = {
    reportId: randomUUID(),
    userId,
    date: input.date,
    hours: input.hours,
    content: input.content.trim(),
    understanding: input.understanding,
    comment: input.comment?.trim() ?? "",
    createdAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: TABLES.reports, Item: report }));
  return report;
}

/* ---------- phases ---------- */

export async function listPhases(): Promise<Phase[]> {
  const phases = await scanAll<Phase>({ TableName: TABLES.phases });
  return phases.sort((a, b) => a.order - b.order || a.phaseId.localeCompare(b.phaseId));
}

export async function getPhase(phaseId: string): Promise<Phase | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.phases, Key: { phaseId } }));
  return (res.Item as Phase | undefined) ?? null;
}

export async function savePhase(input: Omit<Phase, "phaseId">, phaseId?: string): Promise<Phase> {
  const phase: Phase = { ...input, phaseId: phaseId ?? newId("p") };
  await ddb.send(new PutCommand({ TableName: TABLES.phases, Item: phase }));
  return phase;
}

export async function deletePhase(phaseId: string): Promise<void> {
  const contents = await listContents();
  if (contents.some((c) => c.phaseId === phaseId)) {
    throw new InputError("コンテンツが登録されているフェーズは削除できません。先にコンテンツを削除または移動してください");
  }
  await ddb.send(new DeleteCommand({ TableName: TABLES.phases, Key: { phaseId } }));
}

/* ---------- contents ---------- */

export async function listContents(): Promise<Content[]> {
  const contents = await scanAll<Content>({ TableName: TABLES.contents });
  return contents.sort((a, b) => a.order - b.order || a.contentId.localeCompare(b.contentId));
}

export async function getContent(contentId: string): Promise<Content | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.contents, Key: { contentId } }));
  return (res.Item as Content | undefined) ?? null;
}

export async function saveContent(
  input: Omit<Content, "contentId">,
  contentId?: string,
): Promise<Content> {
  if (!(await getPhase(input.phaseId))) throw new InputError("対象フェーズが存在しません");
  // 字幕・教材テキストはコンテンツの編集フォームでは扱わないため、更新時は既存の値を引き継ぐ
  const existing = contentId ? await getContent(contentId) : null;
  const content: Content = {
    ...input,
    transcript: input.transcript ?? existing?.transcript,
    contentId: contentId ?? newId("c"),
  };
  await ddb.send(new PutCommand({ TableName: TABLES.contents, Item: content }));
  return content;
}

/** AI テスト生成用の字幕・教材テキストを保存する */
export async function saveTranscript(contentId: string, transcript: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.contents,
      Key: { contentId },
      UpdateExpression: "SET transcript = :t",
      ConditionExpression: "attribute_exists(contentId)",
      ExpressionAttributeValues: { ":t": transcript },
    }),
  );
}

/** コンテンツと、その問題をまとめて削除する */
export async function deleteContent(contentId: string): Promise<void> {
  const tests = await listTestsByContent(contentId);
  for (let i = 0; i < tests.length; i += 25) {
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLES.tests]: tests
            .slice(i, i + 25)
            .map((t) => ({ DeleteRequest: { Key: { testId: t.testId } } })),
        },
      }),
    );
  }
  await ddb.send(new DeleteCommand({ TableName: TABLES.contents, Key: { contentId } }));
}

/* ---------- tests ---------- */

export async function listAllTests(): Promise<Test[]> {
  const tests = await scanAll<Test>({ TableName: TABLES.tests });
  return tests.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.testId.localeCompare(b.testId));
}

export async function listTestsByContent(contentId: string): Promise<Test[]> {
  const tests = await scanAll<Test>({
    TableName: TABLES.tests,
    FilterExpression: "contentId = :c",
    ExpressionAttributeValues: { ":c": contentId },
  });
  return tests.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.testId.localeCompare(b.testId));
}

export function toPublicTests(tests: Test[]): PublicTest[] {
  return tests.map((t) => ({
    testId: t.testId,
    contentId: t.contentId,
    question: t.question,
    choices: t.choices ?? [],
    order: t.order ?? 0,
  }));
}

export async function getTest(testId: string): Promise<Test | null> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.tests, Key: { testId } }));
  return (res.Item as Test | undefined) ?? null;
}

export async function saveTest(input: Omit<Test, "testId">, testId?: string): Promise<Test> {
  if (!(await getContent(input.contentId))) throw new InputError("対象コンテンツが存在しません");
  const test: Test = { ...input, testId: testId ?? newId("t") };
  await ddb.send(new PutCommand({ TableName: TABLES.tests, Item: test }));
  return test;
}

export async function deleteTest(testId: string): Promise<void> {
  await ddb.send(new DeleteCommand({ TableName: TABLES.tests, Key: { testId } }));
}

/* ---------- content_progress ---------- */

const STATUS_RANK: Record<ProgressStatus, number> = {
  not_started: 0,
  learning: 1,
  testing: 2,
  completed: 3,
};

export async function listUserProgress(userId: string): Promise<ContentProgress[]> {
  return queryAll<ContentProgress>({
    TableName: TABLES.contentProgress,
    KeyConditionExpression: "userId = :u",
    ExpressionAttributeValues: { ":u": userId },
  });
}

export async function listAllProgress(): Promise<ContentProgress[]> {
  return scanAll<ContentProgress>({ TableName: TABLES.contentProgress });
}

async function getContentProgress(userId: string, contentId: string): Promise<ContentProgress | null> {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.contentProgress, Key: { userId, contentId } }),
  );
  return (res.Item as ContentProgress | undefined) ?? null;
}

/**
 * 状態を進める（受講中・テスト受験中）。状態は後戻りしない（完了済みはそのまま）
 */
export async function advanceStatus(
  userId: string,
  contentId: string,
  status: "learning" | "testing",
): Promise<ContentProgress> {
  const current = await getContentProgress(userId, contentId);
  if (current && STATUS_RANK[current.status] >= STATUS_RANK[status]) return current;

  const now = new Date().toISOString();
  const next: ContentProgress = {
    ...current,
    userId,
    contentId,
    status,
    startedAt: current?.startedAt ?? now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.contentProgress, Item: next }));
  return next;
}

/** コンテンツを完了にする（テスト合格時、またはテストのないコンテンツの完了操作時） */
export async function completeContent(
  userId: string,
  contentId: string,
  score?: number,
): Promise<ContentProgress> {
  const current = await getContentProgress(userId, contentId);
  const now = new Date().toISOString();
  const best = Math.max(score ?? -1, current?.score ?? -1);
  const next: ContentProgress = {
    userId,
    contentId,
    status: "completed",
    score: best >= 0 ? best : undefined,
    startedAt: current?.startedAt ?? now,
    completedAt: current?.status === "completed" ? current.completedAt : now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.contentProgress, Item: next }));
  return next;
}

/** 不合格時：テスト受験中のまま最高得点だけ更新する */
async function recordFailedAttempt(userId: string, contentId: string, score: number): Promise<void> {
  const current = await getContentProgress(userId, contentId);
  if (current?.status === "completed") {
    // 合格済みのコンテンツを再受験して不合格でも、完了は取り消さない
    return;
  }
  const now = new Date().toISOString();
  const next: ContentProgress = {
    userId,
    contentId,
    status: "testing",
    score: Math.max(score, current?.score ?? 0),
    startedAt: current?.startedAt ?? now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.contentProgress, Item: next }));
}

/* ---------- test_results ---------- */

export async function listTestResults(userId?: string): Promise<TestResult[]> {
  const results = await scanAll<TestResult>({ TableName: TABLES.testResults, ...byUser(userId) });
  return results.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

/** コンテンツのテストを採点し、結果と進捗を保存する */
export async function submitTest(
  userId: string,
  content: Content,
  answers: Record<string, number>,
): Promise<TestResult> {
  const tests = await listTestsByContent(content.contentId);
  if (tests.length === 0) throw new InputError("このコンテンツには問題が登録されていません");

  const details = tests.map((t) => {
    const raw = answers[t.testId];
    const selected = typeof raw === "number" ? raw : null;
    return {
      testId: t.testId,
      question: t.question,
      choices: t.choices ?? [],
      selected,
      answer: t.answer,
      correct: selected === t.answer,
      explanation: t.explanation ?? "",
    };
  });
  const correctCount = details.filter((d) => d.correct).length;
  const score = Math.round((correctCount / tests.length) * 100);
  const passed = score >= content.passScore;

  const previous = (await listTestResults(userId)).filter((r) => r.contentId === content.contentId);

  const result: TestResult = {
    resultId: randomUUID(),
    userId,
    contentId: content.contentId,
    score,
    passScore: content.passScore,
    passed,
    attempts: previous.length + 1,
    correctCount,
    total: tests.length,
    details,
    takenAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: TABLES.testResults, Item: result }));

  if (passed) {
    await completeContent(userId, content.contentId, score);
  } else {
    await recordFailedAttempt(userId, content.contentId, score);
  }
  return result;
}
