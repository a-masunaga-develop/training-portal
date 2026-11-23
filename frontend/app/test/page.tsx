import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TestForm } from "@/components/test-form";
import { requireSessionUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { listPublicTests, listTestResults } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const user = await requireSessionUser();
  const [tests, results] = await Promise.all([listPublicTests(), listTestResults(user.userId)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Phase1 テスト</h1>
        <p className="text-sm text-muted-foreground">全{tests.length}問。すべて回答してから採点してください。</p>
      </div>

      {tests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            問題が登録されていません。infrastructure/dynamodb/seed.sh を実行してください。
          </CardContent>
        </Card>
      ) : (
        <TestForm tests={tests} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">受験履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ受験していません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>受験日時</TableHead>
                  <TableHead className="text-right">正解数</TableHead>
                  <TableHead className="text-right">得点</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.resultId}>
                    <TableCell>{formatDateTime(r.takenAt)}</TableCell>
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
    </div>
  );
}
