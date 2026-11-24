import { CONTENT_TYPES, type Content, type ContentType, type Phase, type Test } from "./types";

type Result<T> = { value: T; errors?: undefined } | { value?: undefined; errors: string[] };

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function int(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Number.isInteger(n) ? n : null;
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function parsePhase(body: Record<string, unknown> | null): Result<Omit<Phase, "phaseId">> {
  const errors: string[] = [];
  const title = str(body?.title);
  const order = int(body?.order);
  if (!title) errors.push("タイトルを入力してください");
  if (order === null || order < 0) errors.push("表示順は0以上の整数で入力してください");
  if (errors.length) return { errors };
  return {
    value: {
      title,
      description: str(body?.description),
      order: order!,
      published: body?.published === true,
    },
  };
}

/** URL が必要なコンテンツ種別 */
export const URL_REQUIRED_TYPES: ContentType[] = ["video", "external", "pdf"];

export function parseContent(body: Record<string, unknown> | null): Result<Omit<Content, "contentId">> {
  const errors: string[] = [];
  const title = str(body?.title);
  const phaseId = str(body?.phaseId);
  const type = str(body?.type) as ContentType;
  const url = str(body?.url);
  const passScore = int(body?.passScore);
  const order = int(body?.order);

  if (!title) errors.push("タイトルを入力してください");
  if (!phaseId) errors.push("対象フェーズを選択してください");
  if (!CONTENT_TYPES.includes(type)) errors.push("コンテンツ種別を選択してください");
  if (URL_REQUIRED_TYPES.includes(type) && !url) errors.push("この種別では URL を入力してください");
  if (url && !isHttpUrl(url)) errors.push("URL は http:// または https:// で始まる形式で入力してください");
  if (passScore === null || passScore < 0 || passScore > 100) errors.push("合格点は0〜100の整数で入力してください");
  if (order === null || order < 0) errors.push("表示順は0以上の整数で入力してください");
  if (errors.length) return { errors };

  return {
    value: {
      title,
      phaseId,
      type,
      url,
      description: str(body?.description),
      body: typeof body?.body === "string" ? body.body.replace(/\r\n/g, "\n").trim() : "",
      passScore: passScore!,
      order: order!,
      published: body?.published === true,
    },
  };
}

export function parseTest(body: Record<string, unknown> | null): Result<Omit<Test, "testId">> {
  const errors: string[] = [];
  const contentId = str(body?.contentId);
  const question = str(body?.question);
  const choices = Array.isArray(body?.choices) ? body.choices.map(str) : [];
  if (choices.some((c) => !c)) errors.push("空の選択肢があります");
  const answer = int(body?.answer);
  const order = int(body?.order);

  if (!contentId) errors.push("対象コンテンツを指定してください");
  if (!question) errors.push("問題文を入力してください");
  if (choices.length < 2) errors.push("選択肢は2つ以上入力してください");
  if (answer === null || answer < 0 || answer >= choices.length) errors.push("正解の選択肢を選んでください");
  if (order === null || order < 0) errors.push("表示順は0以上の整数で入力してください");
  if (errors.length) return { errors };

  return {
    value: {
      contentId,
      question,
      choices,
      answer: answer!,
      explanation: str(body?.explanation),
      order: order!,
    },
  };
}
