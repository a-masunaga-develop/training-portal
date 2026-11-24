import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportList } from "@/components/report-list";
import { StatusBadge } from "@/components/status-badge";
import { getCurriculum } from "@/lib/curriculum";
import { formatDateTime } from "@/lib/format";
import { getUser, listReports, listTestResults } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminStudentPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getUser(userId);
  if (!user) notFound();

  const [curriculum, results, reports] = await Promise.all([
    getCurriculum(userId),
    listTestResults(userId),
    listReports(userId),
  ]);
  const titles = new Map(curriculum.items.map((i) => [i.content.contentId, i.content.title]));
  const attemptsByContent = new Map<string, number>();
  for (const r of results) {
    if (r.contentId) attemptsByContent.set(r.contentId, (attemptsByContent.get(r.contentId) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/admin/students" className="text-sm text-muted-foreground hover:underline">
          ← 受講者一覧
        </Link>
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-sm text-muted-foreground">
          {user.email ?? "メールアドレス未登録"}・{user.userId}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardDescription>学習進捗率</CardDescription>
          <CardTitle className="text-3xl">{curriculum.rate}%</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={curriculum.rate} className="max-w-md" />
          <p className="text-sm text-muted-foreground">
            {curriculum.completedCount} / {curriculum.total} コンテンツ完了
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">コンテンツ別の進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">順</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>コンテンツ</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="text-right">最高得点</TableHead>
                <TableHead className="text-right">受験回数</TableHead>
                <TableHead className="text-right">完了日時</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {curriculum.items.map((item) => (
                <TableRow key={item.content.contentId}>
                  <TableCell>{item.position}</TableCell>
                  <TableCell className="text-muted-foreground">{item.phase.title}</TableCell>
                  <TableCell>{item.content.title}</TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} locked={!item.unlocked} />
                  </TableCell>
                  <TableCell className="text-right">{item.score !== undefined ? `${item.score}点` : "—"}</TableCell>
                  <TableCell className="text-right">{attemptsByContent.get(item.content.contentId) ?? 0}回</TableCell>
                  <TableCell className="text-right">
                    {item.completedAt ? formatDateTime(item.completedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
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
                  <TableHead>コンテンツ</TableHead>
                  <TableHead className="text-right">正解数</TableHead>
                  <TableHead className="text-right">得点</TableHead>
                  <TableHead className="text-right">判定</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.resultId}>
                    <TableCell>{formatDateTime(r.takenAt)}</TableCell>
                    <TableCell>
                      {r.contentId ? titles.get(r.contentId) ?? r.contentId : `${r.phase ?? ""}（v0.2.0以前）`}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.correctCount} / {r.total}
                    </TableCell>
                    <TableCell className="text-right font-medium">{r.score}点</TableCell>
                    <TableCell className="text-right">
                      {r.contentId ? (
                        <Badge variant={r.passed ? "default" : "destructive"}>{r.passed ? "合格" : "不合格"}</Badge>
                      ) : (
                        "—"
                      )}
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
          <CardTitle className="text-lg">日報</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportList reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
