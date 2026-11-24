import "server-only";
import { z } from "zod/v4";
import { InputError } from "../repository";
import type { Content, Test } from "../types";
import { runStructured } from "./client";

/** 教材テキストの上限（これを超える場合は切り詰めず、エラーにして分割を促す） */
const MAX_SOURCE_CHARS = 150_000;

export type GeneratedQuestion = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  topic: string;
};

const SYSTEM = `あなたは社内IT研修の教材作成を支援するアシスタントです。
受講者はAWSやクラウドを学び始めた新入社員です。
与えられた教材テキストだけを根拠にして作業してください。教材に書かれていない事実を補ったり、推測で断定したりしないでください。
出力はすべて日本語で書いてください。`;

function sourceText(content: Content): string {
  const parts = [
    `タイトル: ${content.title}`,
    content.description && `説明: ${content.description}`,
    content.body && `本文:\n${content.body}`,
    content.transcript && `字幕・教材テキスト:\n${content.transcript}`,
  ].filter(Boolean);
  const text = parts.join("\n\n");

  if (!content.body?.trim() && !content.transcript?.trim()) {
    throw new InputError("教材の本文、または字幕・教材テキストを入力してください");
  }
  if (text.length > MAX_SOURCE_CHARS) {
    throw new InputError(
      `教材テキストが長すぎます（${text.length.toLocaleString()}文字）。${MAX_SOURCE_CHARS.toLocaleString()}文字以内になるよう、コンテンツを分けてください`,
    );
  }
  return text;
}

/* ---------- 学習ポイント抽出 ---------- */

const TopicsSchema = z.object({
  summary: z.string().describe("教材の要点を2〜3文で"),
  topics: z.array(z.string()).describe("受講者が理解すべき学習ポイント。3〜8個、各20文字程度の名詞句"),
});

export async function extractTopics(content: Content, requestedBy: string) {
  const { jobId, output } = await runStructured({
    job: { type: "topic_extraction", requestedBy, contentId: content.contentId },
    system: SYSTEM,
    prompt: `次の教材から、理解度テストで確認すべき学習ポイントを抽出してください。
重要度の高い順に並べ、教材の中心的な概念・用語・手順・注意点を優先してください。

<教材>
${sourceText(content)}
</教材>`,
    schema: TopicsSchema,
    effort: "low",
  });

  const topics = [...new Set(output.topics.map((t) => t.trim()).filter(Boolean))].slice(0, 8);
  if (topics.length === 0) throw new InputError("学習ポイントを抽出できませんでした。教材テキストを見直してください");
  return { jobId, summary: output.summary.trim(), topics };
}

/* ---------- 問題生成 ---------- */

const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe("問題文"),
      choices: z.array(z.string()).describe("選択肢。ちょうど4つ"),
      answer: z.number().int().describe("正解の選択肢の番号（0始まり、0〜3）"),
      explanation: z.string().describe("正解の理由と、誤りの選択肢がなぜ違うかを1〜3文で"),
      topic: z.string().describe("この問題が確認する学習ポイント"),
    }),
  ),
});

/** 生成結果のうち、そのまま使えない問題を取り除く */
function validQuestions(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  return questions
    .map((q) => ({
      question: q.question.trim(),
      choices: q.choices.map((c) => c.trim()),
      answer: q.answer,
      explanation: q.explanation.trim(),
      topic: q.topic.trim(),
    }))
    .filter(
      (q) =>
        q.question &&
        q.choices.length === 4 &&
        q.choices.every(Boolean) &&
        new Set(q.choices).size === 4 &&
        Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer < 4,
    );
}

export async function generateQuestions(
  content: Content,
  topics: string[],
  count: number,
  existing: Test[],
  requestedBy: string,
) {
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new InputError("問題数は1〜10で指定してください");
  const cleanTopics = topics.map((t) => t.trim()).filter(Boolean);
  if (cleanTopics.length === 0) throw new InputError("学習ポイントを1つ以上指定してください");

  const existingBlock = existing.length
    ? `\n<登録済みの問題>\n${existing.map((t, i) => `${i + 1}. ${t.question}`).join("\n")}\n</登録済みの問題>\n登録済みの問題と同じ内容を問う問題は作らないでください。\n`
    : "";

  const { jobId, output } = await runStructured({
    job: { type: "test_generation", requestedBy, contentId: content.contentId },
    system: SYSTEM,
    prompt: `次の教材の理解度テストとして、4択の選択問題を${count}問作成してください。

作成の条件:
- 学習ポイントをできるだけ偏りなくカバーする
- 正解は教材の記述から一意に決まること。教材に根拠がない問題は作らない
- 誤りの選択肢は、初学者が混同しやすいもっともらしい内容にする（明らかに無関係なものや「すべて正しい」は避ける）
- 正解の位置（answer）が偏らないようにする
- 用語の暗記だけでなく、目的や使い分けを問う問題も含める

<学習ポイント>
${cleanTopics.map((t) => `- ${t}`).join("\n")}
</学習ポイント>
${existingBlock}
<教材>
${sourceText(content)}
</教材>`,
    schema: QuestionsSchema,
    effort: "medium",
  });

  const questions = validQuestions(output.questions).slice(0, count);
  if (questions.length === 0) throw new InputError("使える問題を生成できませんでした。もう一度お試しください");
  return { jobId, questions };
}
