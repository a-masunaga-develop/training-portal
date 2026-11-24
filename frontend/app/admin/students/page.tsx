import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { getStudentSummaries } from "@/lib/admin-data";
import { nextItem } from "@/lib/learning";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const { students } = await getStudentSummaries();
  const columns = students[0]?.curriculum.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">受講者一覧</CardTitle>
          <p className="text-sm text-muted-foreground">
            受講者の追加・削除は Cognito で行い、users テーブルにメールアドレスを登録してください。
          </p>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">受講者はいません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead className="w-1/4">進捗率</TableHead>
                  <TableHead>現在のコンテンツ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(({ user, curriculum }) => {
                  const current = nextItem(curriculum);
                  return (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <Link href={`/admin/students/${user.userId}`} className="font-medium underline-offset-4 hover:underline">
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email ?? "（未登録）"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={curriculum.rate} />
                          <span className="w-20 text-right text-xs text-muted-foreground">
                            {curriculum.completedCount}/{curriculum.total}（{curriculum.rate}%）
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {current ? (
                          <span className="flex flex-wrap items-center gap-2">
                            {current.content.title}
                            <StatusBadge status={current.status} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{curriculum.total ? "すべて完了" : "—"}</span>
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

      {students.length > 0 && columns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">進捗状況（コンテンツ別）</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>氏名</TableHead>
                  {columns.map((c) => (
                    <TableHead key={c.content.contentId} className="min-w-28">
                      {c.position}. {c.content.title}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(({ user, curriculum }) => (
                  <TableRow key={user.userId}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    {curriculum.items.map((item) => (
                      <TableCell key={item.content.contentId}>
                        <div className="space-y-1">
                          <StatusBadge status={item.status} locked={!item.unlocked} />
                          {item.score !== undefined && (
                            <p className="text-xs text-muted-foreground">{item.score}点</p>
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
