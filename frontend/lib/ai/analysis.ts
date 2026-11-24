import "server-only";
import { z } from "zod/v4";
import { getCurriculum } from "../curriculum";
import { InputError, listReports, listTestResults } from "../repository";
import type { User } from "../types";
import { runStructured } from "./client";
import { saveRecommendation, type Recommendation, type UnderstandingLevel } from "./store";

const LEVELS = ["understood", "partial", "weak", "not_started"] as const;

const AnalysisSchema = z.object({
  summary: z.string().describe("受講者の現在の学習状況を2〜3文で。本人に語りかける口調"),
  understanding: z
    .array(
      z.object({
        contentId: z.string(),
        level: z.enum(LEVELS),
        comment: z.string().describe("判定の根拠を1文で"),
      }),
    )
    .describe("カリキュラムの各コンテンツの理解度"),
  weaknesses: z.array(z.string()).describe("最近の弱点。具体的な概念名で0〜5個"),
  recommendations: z
    .array(z.object({ contentId: z.string(), reason: z.string().describe("推奨理由を1文で") }))
    .describe("次に学ぶべき、または復習すべきコンテンツ。優先順に1〜3個"),
  advice: z.string().describe("次の学習で意識するとよいことを1〜2文で"),
});

const SYSTEM = `あなたは社内IT研修の学習アドバイザーです。
受講者の進捗・テスト結果・日報をもとに、理解度を判定し、次に学ぶべき教材を提案します。

判定の基準:
- understood: テストに合格し、誤答や日報から見て理解に問題がない
- partial: 合格はしたが誤答がある、または不合格だが得点が合格点に近い、または日報の理解度が低い
- weak: 不合格が続いている、得点が低い、または日報で理解できていないと書いている
- not_started: まだ学習・受験していない

データにないことを推測で断定しないでください。根拠が少ない場合は控えめに判定してください。
推奨するコンテンツは、受講可能（unlocked: true）なものの中から選んでください。完了済みで理解が不十分なものの復習を推奨してもかまいません。
出力はすべて日本語で書いてください。`;

/** 受講者の学習データを AI に渡す形にまとめる */
async function buildInput(user: User) {
  const [curriculum, results, reports] = await Promise.all([
    getCurriculum(user.userId),
    listTestResults(user.userId),
    listReports(user.userId),
  ]);

  const contents = curriculum.items.map((item) => {
    const contentResults = results.filter((r) => r.contentId === item.content.contentId);
    const latest = contentResults[0];
    return {
      contentId: item.content.contentId,
      title: item.content.title,
      phase: item.phase.title,
      status: item.status,
      unlocked: item.unlocked,
      passScore: item.content.passScore,
      bestScore: item.score ?? null,
      attempts: contentResults.length,
      latestScore: latest?.score ?? null,
      // 直近の受験で間違えた問題（どこでつまずいているかの手がかり）
      latestWrongQuestions:
        latest?.details
          .filter((d) => !d.correct)
          .map((d) => ({ question: d.question, correctAnswer: d.choices[d.answer] })) ?? [],
    };
  });

  const recentReports = reports.slice(0, 10).map((r) => ({
    date: r.date,
    hours: r.hours,
    understanding: `${r.understanding}/5`,
    content: r.content,
    comment: r.comment,
  }));

  return { curriculum, payload: { progressRate: `${curriculum.rate}%`, contents, recentReports } };
}

/** 理解度分析と学習推薦を実行し、recommendations に保存する */
export async function analyzeLearning(user: User, requestedBy: string): Promise<Recommendation> {
  const { curriculum, payload } = await buildInput(user);
  if (curriculum.total === 0) {
    throw new InputError("公開中のコンテンツがないため分析できません");
  }

  const { jobId, output } = await runStructured({
    job: { type: "learning_analysis", requestedBy, userId: user.userId },
    system: SYSTEM,
    prompt: `次の受講者の学習データを分析してください。

<学習データ>
${JSON.stringify(payload, null, 2)}
</学習データ>`,
    schema: AnalysisSchema,
    effort: "low",
  });

  // AI が存在しない contentId や受講できないコンテンツを返した場合は除外する
  const known = new Map(curriculum.items.map((i) => [i.content.contentId, i]));
  const understanding = output.understanding
    .filter((u) => known.has(u.contentId))
    .map((u) => ({ contentId: u.contentId, level: u.level as UnderstandingLevel, comment: u.comment.trim() }));
  const recommendations = output.recommendations
    .filter((r) => known.get(r.contentId)?.unlocked)
    .filter((r, i, list) => list.findIndex((x) => x.contentId === r.contentId) === i)
    .slice(0, 3)
    .map((r) => ({ contentId: r.contentId, reason: r.reason.trim() }));

  const rec: Recommendation = {
    userId: user.userId,
    jobId,
    generatedAt: new Date().toISOString(),
    summary: output.summary.trim(),
    understanding,
    weaknesses: output.weaknesses.map((w) => w.trim()).filter(Boolean).slice(0, 5),
    recommendedContents: recommendations.map((r) => r.contentId),
    recommendations,
    advice: output.advice.trim(),
  };
  await saveRecommendation(rec);
  return rec;
}
