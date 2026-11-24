import "server-only";
import { z } from "zod/v4";
import { getStudentSummaries } from "../admin-data";
import { InputError, listAllProgress, listReports, listTestResults } from "../repository";
import { runStructured } from "./client";

/** 最後の学習からこの日数を過ぎると「遅延」とみなす */
export const DELAY_DAYS = 7;

export type StudentState = "completed" | "on_track" | "delayed" | "not_started";

export const STUDENT_STATE_LABELS: Record<StudentState, string> = {
  completed: "完了",
  on_track: "順調",
  delayed: "遅延",
  not_started: "未開始",
};

export type AdminReport = {
  generatedAt: string;
  stats: Record<StudentState, number> & { total: number; averageRate: number };
  students: { userId: string; name: string; state: StudentState; rate: number; lastActivity: string | null }[];
  overview: string;
  commonIssues: string[];
  atRiskStudents: { userId: string; name: string; reason: string }[];
  suggestions: string[];
};

const ReportSchema = z.object({
  overview: z.string().describe("研修全体の状況を3〜4文で。研修担当者向け"),
  commonIssues: z.array(z.string()).describe("複数の受講者に共通する課題。0〜5個"),
  atRiskStudents: z
    .array(z.object({ userId: z.string(), reason: z.string().describe("支援が必要な理由を1文で") }))
    .describe("フォローが必要な受講者"),
  suggestions: z.array(z.string()).describe("研修担当者が取るとよい具体的な対応。1〜4個"),
});

const SYSTEM = `あなたは社内IT研修の研修担当者を補佐するアナリストです。
受講者全体の進捗・テスト結果・日報から、研修の状況と共通課題をまとめます。
集計値（人数・進捗率）はデータに書かれている値をそのまま使い、計算し直したり推測で補ったりしないでください。
個人を責める表現は避け、支援の観点で書いてください。出力はすべて日本語で書いてください。`;

/** 受講者ごとの状態（完了・順調・遅延・未開始）はコードで判定する */
async function buildStats() {
  const [{ students, contents }, progress, results, reports] = await Promise.all([
    getStudentSummaries(),
    listAllProgress(),
    listTestResults(),
    listReports(),
  ]);
  const now = Date.now();
  const titles = new Map(contents.map((c) => [c.contentId, c.title]));

  const rows = students.map(({ user, curriculum }) => {
    const activity = [
      ...progress.filter((p) => p.userId === user.userId).map((p) => p.updatedAt),
      ...reports.filter((r) => r.userId === user.userId).map((r) => r.createdAt),
    ].sort();
    const lastActivity = activity.at(-1) ?? null;
    const idleDays = lastActivity ? (now - Date.parse(lastActivity)) / 86_400_000 : Infinity;

    let state: StudentState;
    if (curriculum.total > 0 && curriculum.completedCount === curriculum.total) state = "completed";
    else if (!lastActivity) state = "not_started";
    else if (idleDays > DELAY_DAYS) state = "delayed";
    else state = "on_track";

    const userResults = results.filter((r) => r.userId === user.userId && r.contentId);
    const failed = userResults.filter((r) => !r.passed);
    return {
      user,
      curriculum,
      state,
      lastActivity,
      detail: {
        userId: user.userId,
        name: user.name,
        state,
        progressRate: `${curriculum.rate}%`,
        daysSinceLastActivity: Number.isFinite(idleDays) ? Math.floor(idleDays) : null,
        currentContent: curriculum.items.find((i) => i.unlocked && i.status !== "completed")?.content.title ?? null,
        failedAttempts: failed.length,
        // 不合格になったコンテンツと、よく間違えた問題
        failedContents: [...new Set(failed.map((r) => titles.get(r.contentId) ?? r.contentId))],
        wrongQuestions: [
          ...new Set(userResults.flatMap((r) => r.details.filter((d) => !d.correct).map((d) => d.question))),
        ].slice(0, 10),
        recentReportUnderstanding: reports
          .filter((r) => r.userId === user.userId)
          .slice(0, 5)
          .map((r) => ({ date: r.date, understanding: `${r.understanding}/5`, comment: r.comment || r.content })),
      },
    };
  });

  const count = (s: StudentState) => rows.filter((r) => r.state === s).length;
  const stats = {
    total: rows.length,
    completed: count("completed"),
    on_track: count("on_track"),
    delayed: count("delayed"),
    not_started: count("not_started"),
    averageRate: rows.length ? Math.round(rows.reduce((s, r) => s + r.curriculum.rate, 0) / rows.length) : 0,
  };
  return { rows, stats };
}

export async function generateAdminReport(requestedBy: string): Promise<{ jobId: string; report: AdminReport }> {
  const { rows, stats } = await buildStats();
  if (rows.length === 0) throw new InputError("受講者がいないためレポートを作成できません");

  const { jobId, output } = await runStructured({
    job: { type: "admin_report", requestedBy },
    system: SYSTEM,
    prompt: `次のデータから研修の管理レポートを作成してください。
「遅延」は最後の学習から${DELAY_DAYS}日以上たっている受講者です。

<集計>
${JSON.stringify(stats, null, 2)}
</集計>

<受講者ごとのデータ>
${JSON.stringify(rows.map((r) => r.detail), null, 2)}
</受講者ごとのデータ>`,
    schema: ReportSchema,
    effort: "medium",
  });

  const names = new Map(rows.map((r) => [r.user.userId, r.user.name]));
  const report: AdminReport = {
    generatedAt: new Date().toISOString(),
    stats,
    students: rows.map((r) => ({
      userId: r.user.userId,
      name: r.user.name,
      state: r.state,
      rate: r.curriculum.rate,
      lastActivity: r.lastActivity,
    })),
    overview: output.overview.trim(),
    commonIssues: output.commonIssues.map((s) => s.trim()).filter(Boolean),
    atRiskStudents: output.atRiskStudents
      .filter((s) => names.has(s.userId))
      .map((s) => ({ userId: s.userId, name: names.get(s.userId)!, reason: s.reason.trim() })),
    suggestions: output.suggestions.map((s) => s.trim()).filter(Boolean),
  };
  return { jobId, report };
}
