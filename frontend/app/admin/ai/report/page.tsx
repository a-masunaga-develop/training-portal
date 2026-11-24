import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AiNotConfigured } from "@/components/admin/ai-not-configured";
import { RunAiButton } from "@/components/ai/run-ai-button";
import { isAiConfigured } from "@/lib/ai/client";
import { DELAY_DAYS, STUDENT_STATE_LABELS, type AdminReport, type StudentState } from "@/lib/ai/report";
import { listJobs } from "@/lib/ai/store";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATE_VARIANTS: Record<StudentState, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  on_track: "secondary",
  delayed: "destructive",
  not_started: "outline",
};

export default async function AdminAiReportPage() {
  const enabled = isAiConfigured();
  const jobs = await listJobs({ type: "admin_report" });
  const latest = jobs.find((j) => j.status === "completed" && j.output && "stats" in (j.output as object));
  const report = latest?.output as AdminReport | undefined;

  return (
    <div className="space-y-4">
      {!enabled && <AiNotConfigured />}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">AI管理レポート</CardTitle>
              <CardDescription>
                全受講者の進捗・テスト結果・日報から、AI が研修の状況と共通課題をまとめます。
                {report && ` 最終作成：${formatDateTime(report.generatedAt)}`}
              </CardDescription>
            </div>
            {enabled && (
              <RunAiButton
                url="/api/admin/ai/report"
                label={report ? "レポートを更新" : "レポートを作成"}
                pendingLabel="AI がレポートを作成しています..."
                size="default"
              />
            )}
          </div>
        </CardHeader>
      </Card>

      {!report ? (
        <p className="text-sm text-muted-foreground">まだレポートはありません。</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-5">
            <Card>
              <CardHeader>
                <CardDescription>受講者数</CardDescription>
                <CardTitle className="text-2xl">{report.stats.total}名</CardTitle>
              </CardHeader>
            </Card>
            {(["completed", "on_track", "delayed", "not_started"] as const).map((s) => (
              <Card key={s}>
                <CardHeader>
                  <CardDescription>{STUDENT_STATE_LABELS[s]}</CardDescription>
                  <CardTitle className="text-2xl">{report.stats[s]}名</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            平均進捗率 {report.stats.averageRate}%。「遅延」は最後の学習から{DELAY_DAYS}日以上たっている受講者です（人数はシステムで集計）。
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">全体の状況</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{report.overview}</p>
              {report.commonIssues.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">共通課題</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {report.commonIssues.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {report.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium">おすすめの対応</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {report.suggestions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {report.atRiskStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">フォローが必要な受講者</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {report.atRiskStudents.map((s) => (
                    <li key={s.userId} className="rounded-md border p-3">
                      <Link href={`/admin/students/${s.userId}`} className="font-medium underline-offset-4 hover:underline">
                        {s.name}
                      </Link>
                      <p className="text-muted-foreground">{s.reason}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">受講者の状態（作成時点）</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>氏名</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead className="text-right">進捗率</TableHead>
                    <TableHead className="text-right">最後の学習</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.students.map((s) => (
                    <TableRow key={s.userId}>
                      <TableCell>
                        <Link href={`/admin/students/${s.userId}`} className="underline-offset-4 hover:underline">
                          {s.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATE_VARIANTS[s.state]}>{STUDENT_STATE_LABELS[s.state]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{s.rate}%</TableCell>
                      <TableCell className="text-right">{s.lastActivity ? formatDateTime(s.lastActivity) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">AI の判断には誤りが含まれることがあります。</p>
        </>
      )}
    </div>
  );
}
