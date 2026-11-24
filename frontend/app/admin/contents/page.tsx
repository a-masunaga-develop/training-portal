import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAllTests, listContents, listPhases } from "@/lib/repository";
import { CONTENT_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminContentsPage() {
  const [phases, contents, tests] = await Promise.all([listPhases(), listContents(), listAllTests()]);
  const testCounts = new Map<string, number>();
  for (const t of tests) testCounts.set(t.contentId, (testCounts.get(t.contentId) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          コンテンツを選ぶと、内容の編集と理解度テストの問題を管理できます。
        </p>
        {phases.length === 0 ? (
          <Button disabled>コンテンツを追加</Button>
        ) : (
          <Button asChild>
            <Link href="/admin/contents/new">コンテンツを追加</Link>
          </Button>
        )}
      </div>

      {phases.length === 0 && (
        <p className="text-sm text-muted-foreground">先に「Phase管理」でフェーズを登録してください。</p>
      )}

      {phases.map((phase) => {
        const list = contents.filter((c) => c.phaseId === phase.phaseId);
        return (
          <Card key={phase.phaseId}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{phase.title}</CardTitle>
                {!phase.published && <Badge variant="outline">フェーズ非公開</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground">コンテンツはまだありません。</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">順</TableHead>
                      <TableHead>タイトル</TableHead>
                      <TableHead>種別</TableHead>
                      <TableHead className="text-right">問題数</TableHead>
                      <TableHead className="text-right">合格点</TableHead>
                      <TableHead className="text-right">状態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((c) => {
                      const count = testCounts.get(c.contentId) ?? 0;
                      return (
                        <TableRow key={c.contentId}>
                          <TableCell>{c.order}</TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/contents/${c.contentId}`}
                              className="font-medium underline-offset-4 hover:underline"
                            >
                              {c.title}
                            </Link>
                          </TableCell>
                          <TableCell>{CONTENT_TYPE_LABELS[c.type] ?? c.type}</TableCell>
                          <TableCell className="text-right">
                            {count === 0 ? <span className="text-muted-foreground">なし</span> : `${count}問`}
                          </TableCell>
                          <TableCell className="text-right">{c.passScore}点</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={c.published ? "default" : "outline"}>
                              {c.published ? "公開" : "非公開"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
