import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportList } from "@/components/report-list";
import { LESSONS } from "@/lib/content";
import { formatDateTime, todayJst } from "@/lib/format";
import { listProgress, listReports, listTestResults, listUsers } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [users, progressList, reports, results] = await Promise.all([
    listUsers(),
    listProgress(),
    listReports(),
    listTestResults(),
  ]);

  const students = users.filter((u) => u.role === "student");
  const names = Object.fromEntries(users.map((u) => [u.userId, u.name]));
  const progressByUser = new Map(progressList.map((p) => [p.userId, p]));
  const today = todayJst();

  const avgProgress =
    students.length === 0
      ? 0
      : Math.round(
          students.reduce((sum, s) => sum + (progressByUser.get(s.userId)?.completed ?? 0), 0) /
            students.length,
        );
  const submittedToday = new Set(reports.filter((r) => r.date === today).map((r) => r.userId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">管理画面</h1>
        <p className="text-sm text-muted-foreground">受講者の進捗・日報・テスト結果を確認します。</p>
      </div>

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
          <CardTitle className="text-lg">受講者一覧・進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>氏名</TableHead>
                <TableHead className="w-1/3">進捗率</TableHead>
                <TableHead className="text-right">日報数</TableHead>
                <TableHead className="text-right">最新テスト</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const p = progressByUser.get(s.userId);
                const latest = results.find((r) => r.userId === s.userId);
                return (
                  <TableRow key={s.userId}>
                    <TableCell className="font-mono text-xs">{s.userId}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={p?.completed ?? 0} />
                        <span className="w-12 text-right text-xs text-muted-foreground">
                          {p?.completed ?? 0}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p?.completedLessons?.length ?? 0} / {LESSONS.length} レッスン
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {reports.filter((r) => r.userId === s.userId).length}
                    </TableCell>
                    <TableCell className="text-right">{latest ? `${latest.score}点` : "未受験"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">テスト結果</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">テスト結果はまだありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>受験日時</TableHead>
                  <TableHead>氏名</TableHead>
                  <TableHead>フェーズ</TableHead>
                  <TableHead className="text-right">正解数</TableHead>
                  <TableHead className="text-right">得点</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.resultId}>
                    <TableCell>{formatDateTime(r.takenAt)}</TableCell>
                    <TableCell>{names[r.userId] ?? r.userId}</TableCell>
                    <TableCell>{r.phase}</TableCell>
                    <TableCell className="text-right">
                      {r.correctCount} / {r.total}
                    </TableCell>
                    <TableCell className="text-right font-medium">{r.score}点</TableCell>
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
