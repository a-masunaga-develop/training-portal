import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ContentLocked } from "@/components/content-locked";
import { ContentTestForm } from "@/components/content-test-form";
import { MarkStatus } from "@/components/mark-status";
import { requireSessionUser } from "@/lib/auth";
import { checkContentAccess } from "@/lib/curriculum";
import { formatDateTime } from "@/lib/format";
import { listTestResults, listTestsByContent, toPublicTests } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ContentTestPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const user = await requireSessionUser();
  const access = await checkContentAccess(user, contentId);

  if (!access.ok) {
    if (access.reason === "not_found") notFound();
    return <ContentLocked title={access.content?.title} previous={access.previous} />;
  }

  const { content, item, curriculum } = access;
  const [tests, results] = await Promise.all([
    listTestsByContent(content.contentId),
    listTestResults(user.userId),
  ]);
  const history = results.filter((r) => r.contentId === content.contentId);
  const next = item ? curriculum.items[item.position] : undefined;

  return (
    <div className="space-y-6">
      {item && tests.length > 0 && <MarkStatus contentId={content.contentId} status="testing" />}

      <div className="space-y-2">
        <Link href={`/contents/${content.contentId}`} className="text-sm text-muted-foreground hover:underline">
          ← {content.title}
        </Link>
        <h1 className="text-2xl font-bold">理解度テスト：{content.title}</h1>
        <p className="text-sm text-muted-foreground">
          全{tests.length}問・合格点 {content.passScore}点。すべて回答してから採点してください。
        </p>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            このコンテンツには問題が登録されていません。
          </CardContent>
        </Card>
      ) : (
        <ContentTestForm
          contentId={content.contentId}
          tests={toPublicTests(tests)}
          next={next && { contentId: next.content.contentId, title: next.content.title }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">受験履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ受験していません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>回数</TableHead>
                  <TableHead>受験日時</TableHead>
                  <TableHead className="text-right">正解数</TableHead>
                  <TableHead className="text-right">得点</TableHead>
                  <TableHead className="text-right">判定</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((r) => (
                  <TableRow key={r.resultId}>
                    <TableCell>{r.attempts}回目</TableCell>
                    <TableCell>{formatDateTime(r.takenAt)}</TableCell>
                    <TableCell className="text-right">
                      {r.correctCount} / {r.total}
                    </TableCell>
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
    </div>
  );
}
