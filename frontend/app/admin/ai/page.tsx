import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AiNotConfigured } from "@/components/admin/ai-not-configured";
import { isAiConfigured } from "@/lib/ai/client";
import { listAllTests, listContents, listPhases } from "@/lib/repository";
import { CONTENT_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

/** AIテスト生成：コンテンツを選んで、編集画面の「AIテスト生成」へ進む */
export default async function AdminAiTestGenerationPage() {
  const [phases, contents, tests] = await Promise.all([listPhases(), listContents(), listAllTests()]);
  const phaseTitles = new Map(phases.map((p) => [p.phaseId, p.title]));
  const testCounts = new Map<string, number>();
  for (const t of tests) testCounts.set(t.contentId, (testCounts.get(t.contentId) ?? 0) + 1);

  return (
    <div className="space-y-4">
      {!isAiConfigured() && <AiNotConfigured />}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AIテスト生成</CardTitle>
          <CardDescription>
            コンテンツを選ぶと、編集画面の下部で字幕・教材テキストから問題を自動生成できます。
            問題のないコンテンツから優先して作成してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phase</TableHead>
                <TableHead>コンテンツ</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>字幕・教材テキスト</TableHead>
                <TableHead className="text-right">問題数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contents.map((c) => {
                const count = testCounts.get(c.contentId) ?? 0;
                return (
                  <TableRow key={c.contentId}>
                    <TableCell className="text-muted-foreground">{phaseTitles.get(c.phaseId) ?? c.phaseId}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/contents/${c.contentId}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {c.title}
                      </Link>
                      {!c.published && <span className="ml-2 text-xs text-muted-foreground">（非公開）</span>}
                    </TableCell>
                    <TableCell>{CONTENT_TYPE_LABELS[c.type] ?? c.type}</TableCell>
                    <TableCell>
                      {c.transcript?.trim() ? (
                        <Badge variant="secondary">{c.transcript.length.toLocaleString()}文字</Badge>
                      ) : c.body?.trim() ? (
                        <span className="text-xs text-muted-foreground">本文のみ</span>
                      ) : (
                        <Badge variant="outline">未登録</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {count === 0 ? <Badge variant="destructive">なし</Badge> : `${count}問`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
