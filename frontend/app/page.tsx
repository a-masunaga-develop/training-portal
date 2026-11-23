import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CURRENT_USER_ID } from "@/lib/constants";
import { LESSONS } from "@/lib/content";
import { todayJst } from "@/lib/format";
import { getProgress, getUser, listReports, listTestResults, listTests } from "@/lib/repository";

export const dynamic = "force-dynamic";

const NOTICES = [
  { date: "2026-11-20", text: "Phase1 の学習コンテンツ（クラウド / IAM / S3 / EC2）を公開しました。" },
  { date: "2026-11-20", text: "日報は毎日の学習終了後に登録してください。" },
];

export default async function DashboardPage() {
  const [user, progress, reports, results, tests] = await Promise.all([
    getUser(CURRENT_USER_ID),
    getProgress(CURRENT_USER_ID),
    listReports(CURRENT_USER_ID),
    listTestResults(CURRENT_USER_ID),
    listTests(),
  ]);

  const today = todayJst();
  const submittedToday = reports.some((r) => r.date === today);
  const latestResult = results[0];
  const remainingLessons = LESSONS.filter((l) => !progress.completedLessons.includes(l.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-muted-foreground">{user?.name ?? CURRENT_USER_ID} さん、こんにちは</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>学習進捗率（Phase1）</CardDescription>
            <CardTitle className="text-3xl">{progress.completed}%</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progress.completed} />
            <p className="text-sm text-muted-foreground">
              {progress.completedLessons.length} / {LESSONS.length} レッスン完了
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>テスト</CardDescription>
            <CardTitle className="text-3xl">
              {latestResult ? `${latestResult.score}点` : "未受験"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {latestResult
                ? `最新結果：${latestResult.correctCount} / ${latestResult.total} 問正解`
                : `Phase1 テスト（全${tests.length}問）を受験していません`}
            </p>
            <Button asChild size="sm" variant={latestResult ? "outline" : "default"}>
              <Link href="/test">{latestResult ? "もう一度受験する" : "受験する"}</Link>
            </Button>
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
            <CardTitle>次に学習するレッスン</CardTitle>
          </CardHeader>
          <CardContent>
            {remainingLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Phase1 のレッスンはすべて完了しました。</p>
            ) : (
              <ul className="space-y-2">
                {remainingLessons.map((l) => (
                  <li key={l.id}>
                    <Link href={`/phase1/${l.id}`} className="text-sm underline-offset-4 hover:underline">
                      {l.title}
                    </Link>
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
