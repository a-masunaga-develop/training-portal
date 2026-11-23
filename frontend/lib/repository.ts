import "server-only";
import { GetCommand, PutCommand, ScanCommand, type ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { ddb, TABLES } from "./dynamodb";
import { LESSONS } from "./content";
import type { Progress, PublicTest, Report, Test, TestResult, User } from "./types";

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

function byUser(userId?: string): Partial<ScanCommandInput> {
  return userId
    ? { FilterExpression: "userId = :u", ExpressionAttributeValues: { ":u": userId } }
    : {};
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

/* ---------- progress ---------- */

export async function getProgress(userId: string): Promise<Progress> {
  const res = await ddb.send(new GetCommand({ TableName: TABLES.progress, Key: { userId } }));
  const item = res.Item as Partial<Progress> | undefined;
  return {
    userId,
    phase: item?.phase ?? "phase1",
    completed: item?.completed ?? 0,
    completedLessons: item?.completedLessons ?? [],
  };
}

export async function listProgress(): Promise<Progress[]> {
  return scanAll<Progress>({ TableName: TABLES.progress });
}

export async function completeLesson(userId: string, lessonId: string): Promise<Progress> {
  if (!LESSONS.some((l) => l.id === lessonId)) {
    throw new Error(`存在しないレッスンです: ${lessonId}`);
  }
  const current = await getProgress(userId);
  const lessons = LESSONS.map((l) => l.id).filter(
    (id) => id === lessonId || current.completedLessons.includes(id),
  );
  const next: Progress = {
    ...current,
    completedLessons: lessons,
    completed: Math.round((lessons.length / LESSONS.length) * 100),
  };
  await ddb.send(new PutCommand({ TableName: TABLES.progress, Item: next }));
  return next;
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

/* ---------- tests ---------- */

export async function listTests(phase = "phase1"): Promise<Test[]> {
  const tests = await scanAll<Test>({
    TableName: TABLES.tests,
    FilterExpression: "phase = :p",
    ExpressionAttributeValues: { ":p": phase },
  });
  return tests.sort((a, b) => a.testId.localeCompare(b.testId));
}

export async function listPublicTests(phase = "phase1"): Promise<PublicTest[]> {
  const tests = await listTests(phase);
  return tests.map((t) => ({
    testId: t.testId,
    phase: t.phase,
    question: t.question,
    choices: t.choices ?? [],
  }));
}

/* ---------- test_results ---------- */

export async function listTestResults(userId?: string): Promise<TestResult[]> {
  const results = await scanAll<TestResult>({ TableName: TABLES.testResults, ...byUser(userId) });
  return results.sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export async function gradeAndSave(
  userId: string,
  phase: string,
  answers: Record<string, number>,
): Promise<TestResult> {
  const tests = await listTests(phase);
  if (tests.length === 0) throw new Error("問題が登録されていません");

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

  const result: TestResult = {
    resultId: randomUUID(),
    userId,
    phase,
    score: Math.round((correctCount / tests.length) * 100),
    correctCount,
    total: tests.length,
    details,
    takenAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName: TABLES.testResults, Item: result }));
  return result;
}
