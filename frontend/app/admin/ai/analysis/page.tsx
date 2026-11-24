import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AiNotConfigured } from "@/components/admin/ai-not-configured";
import { RunAiButton } from "@/components/ai/run-ai-button";
import { isAiConfigured } from "@/lib/ai/client";
import { listRecommendations } from "@/lib/ai/store";
import { getStudentSummaries } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAiAnalysisPage() {
  const enabled = isAiConfigured();
  const [{ students, contents }, recs] = await Promise.all([getStudentSummaries(), listRecommendations()]);
  const recByUser = new Map(recs.map((r) => [r.userId, r]));
  const titles = new Map(contents.map((c) => [c.contentId, c.title]));

  return (
    <div className="space-y-4">
      {!enabled && <AiNotConfigured />}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI理解度分析</CardTitle>
          <CardDescription>
            受講者ごとの理解度・弱点・おすすめ教材です。受講者名を選ぶと詳細を確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">受講者はいません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead className="text-right">進捗率</TableHead>
                  <TableHead>最近の弱点</TableHead>
                  <TableHead>次の推奨</TableHead>
                  <TableHead>分析日時</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(({ user, curriculum }) => {
                  const rec = recByUser.get(user.userId);
                  return (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <Link href={`/admin/students/${user.userId}`} className="font-medium underline-offset-4 hover:underline">
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{curriculum.rate}%</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {rec?.weaknesses.length
                            ? rec.weaknesses.map((w) => (
                                <Badge key={w} variant="outline">
                                  {w}
                                </Badge>
                              ))
                            : <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rec?.recommendedContents[0] ? titles.get(rec.recommendedContents[0]) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rec ? formatDateTime(rec.generatedAt) : "未分析"}
                      </TableCell>
                      <TableCell className="text-right">
                        {enabled && (
                          <RunAiButton
                            url={`/api/admin/ai/analysis/${encodeURIComponent(user.userId)}`}
                            label={rec ? "再分析" : "分析"}
                            variant="outline"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
