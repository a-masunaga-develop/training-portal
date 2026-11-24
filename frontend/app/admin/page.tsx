import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportList } from "@/components/report-list";
import { getStudentSummaries } from "@/lib/admin-data";
import { formatDateTime, todayJst } from "@/lib/format";
import { listReports, listTestResults, listUsers } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [{ students, contents }, users, reports, results] = await Promise.all([
    getStudentSummaries(),
    listUsers(),
    listReports(),
    listTestResults(),
  ]);

  const names = Object.fromEntries(users.map((u) => [u.userId, u.name]));
  const titles = new Map(contents.map((c) => [c.contentId, c.title]));
  const today = todayJst();
  const submittedToday = new Set(reports.filter((r) => r.date === today).map((r) => r.userId));
  const avgProgress =
    students.length === 0
      ? 0
      : Math.round(students.reduce((sum, s) => sum + s.curriculum.rate, 0) / students.length);
  const contentResults = results.filter((r) => r.contentId).slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>受講者数</CardDescription>
            <CardTitle className="text-3xl">{students.length}名</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>平均進捗率</CardDescription>
            <CardTitle className="text-3xl">{avgProgress}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>本日の日報提出</CardDescription>
            <CardTitle className="text-3xl">
              {submittedToday.size} / {students.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">最新のテスト結果</CardTitle>
            <Link href="/admin/students" className="text-sm text-muted-foreground hover:underline">
              受講者ごとの進捗 →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {contentResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">テスト結果はまだありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>受験日時</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>コンテンツ</TableHead>
                  <TableHead className="text-right">回数</TableHead>
                  <TableHead className="text-right">得点</TableHead>
                  <TableHead className="text-right">判定</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentResults.map((r) => (
                  <TableRow key={r.resultId}>
                    <TableCell>{formatDateTime(r.takenAt)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/students/${r.userId}`} className="underline-offset-4 hover:underline">
                        {names[r.userId] ?? r.userId}
                      </Link>
                    </TableCell>
                    <TableCell>{titles.get(r.contentId) ?? r.contentId}</TableCell>
                    <TableCell className="text-right">{r.attempts}回目</TableCell>
                    <TableCell className="text-right font-medium">{r.score}点</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={r.passed ? "default" : "destructive"}>{r.passed ? "合格" : "不合格"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">日報一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportList reports={reports} userNames={names} />
        </CardContent>
      </Card>
    </div>
  );
}
