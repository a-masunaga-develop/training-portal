import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { requireSessionUser } from "@/lib/auth";
import { getCurriculum } from "@/lib/curriculum";
import { formatDateTime, todayJst } from "@/lib/format";
import { nextItem } from "@/lib/learning";
import { listReports, listTestResults } from "@/lib/repository";

export const dynamic = "force-dynamic";

const NOTICES = [
  { date: "2026-11-24", text: "コンテンツごとに「学習 → テスト → 合格」で進む形式になりました。" },
  { date: "2026-11-20", text: "日報は毎日の学習終了後に登録してください。" },
];

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const [curriculum, reports, results] = await Promise.all([
    getCurriculum(user.userId),
    listReports(user.userId),
    listTestResults(user.userId),
  ]);

  const titles = new Map(curriculum.items.map((i) => [i.content.contentId, i.content.title]));
  const inProgress = curriculum.items.filter((i) => i.status === "learning" || i.status === "testing");
  const next = nextItem(curriculum);
  const recentCompleted = curriculum.items
    .filter((i) => i.status === "completed" && i.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 3);
  const latestResult = results.find((r) => r.contentId);
  const today = todayJst();
  const submittedToday = reports.some((r) => r.date === today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">{user.name} さん、こんにちは</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>学習進捗率</CardDescription>
            <CardTitle className="text-3xl">{curriculum.rate}%</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={curriculum.rate} />
            <p className="text-sm text-muted-foreground">
              {curriculum.completedCount} / {curriculum.total} コンテンツ完了
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>最新テスト結果</CardDescription>
            <CardTitle className="text-3xl">{latestResult ? `${latestResult.score}点` : "未受験"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {latestResult ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={latestResult.passed ? "default" : "destructive"}>
                    {latestResult.passed ? "合格" : "不合格"}
                  </Badge>
                  <span>{titles.get(latestResult.contentId) ?? latestResult.contentId}</span>
                </div>
                <p className="text-muted-foreground">{formatDateTime(latestResult.takenAt)}</p>
              </>
            ) : (
              <p className="text-muted-foreground">コンテンツを学習してテストを受けましょう。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>今日の日報（{today}）</CardDescription>
            <CardTitle className="text-3xl">{submittedToday ? "提出済み" : "未提出"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">これまでの提出数：{reports.length} 件</p>
            {!submittedToday && (
              <Button asChild size="sm">
                <Link href="/reports">日報を書く</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>次に学習する教材</CardTitle>
          </CardHeader>
          <CardContent>
            {next ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{next.phase.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{next.content.title}</p>
                    <StatusBadge status={next.status} />
                  </div>
                  {next.content.description && (
                    <p className="text-sm text-muted-foreground">{next.content.description}</p>
                  )}
                </div>
                <Button asChild>
                  <Link href={`/contents/${next.content.contentId}`}>
                    {next.status === "not_started" ? "学習を始める" : "続きから学習する"}
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {curriculum.total === 0
                  ? "公開中のコンテンツはまだありません。"
                  : "公開中のコンテンツはすべて完了しました。"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>現在学習中</CardTitle>
          </CardHeader>
          <CardContent>
            {inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">学習中のコンテンツはありません。</p>
            ) : (
              <ul className="space-y-2">
                {inProgress.map((i) => (
                  <li key={i.content.contentId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <Link href={`/contents/${i.content.contentId}`} className="underline-offset-4 hover:underline">
                      {i.content.title}
                    </Link>
                    <StatusBadge status={i.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近完了した教材</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground">まだ完了した教材はありません。</p>
            ) : (
              <ul className="space-y-2">
                {recentCompleted.map((i) => (
                  <li key={i.content.contentId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <Link href={`/contents/${i.content.contentId}`} className="underline-offset-4 hover:underline">
                      {i.content.title}
                    </Link>
                    <span className="text-muted-foreground">
                      {i.score !== undefined && `${i.score}点・`}
                      {i.completedAt && formatDateTime(i.completedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>お知らせ</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {NOTICES.map((n, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <Badge variant="secondary" className="shrink-0">
                    {n.date}
                  </Badge>
                  <span>{n.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
