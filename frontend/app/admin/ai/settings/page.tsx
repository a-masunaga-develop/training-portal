import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AI_MODEL, isAiConfigured } from "@/lib/ai/client";
import { AI_JOB_TYPE_LABELS, listJobs, type AiJobType } from "@/lib/ai/store";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

/** 費用の目安（米ドル / 100万トークン）。料金改定時はここを更新する */
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};

function monthStartJst(): string {
  const ym = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).format(
    new Date(),
  );
  return new Date(`${ym}-01T00:00:00+09:00`).toISOString();
}

export default async function AdminAiSettingsPage() {
  const configured = isAiConfigured();
  const keySource = process.env.ANTHROPIC_API_KEY
    ? "環境変数（ANTHROPIC_API_KEY）"
    : process.env.CLAUDE_API_KEY_PARAMETER
      ? `SSM パラメータストア（${process.env.CLAUDE_API_KEY_PARAMETER}）`
      : "未設定";

  const jobs = await listJobs({ since: monthStartJst() });
  const recent = jobs.slice(0, 20);
  const types = Object.keys(AI_JOB_TYPE_LABELS) as AiJobType[];
  const byType = types.map((type) => {
    const list = jobs.filter((j) => j.type === type);
    return {
      type,
      count: list.length,
      failed: list.filter((j) => j.status === "failed").length,
      input: list.reduce((s, j) => s + (j.inputTokens ?? 0), 0),
      output: list.reduce((s, j) => s + (j.outputTokens ?? 0), 0),
    };
  });
  const cost = jobs.reduce((sum, j) => {
    const p = PRICES[j.model];
    return p ? sum + ((j.inputTokens ?? 0) * p.input + (j.outputTokens ?? 0) * p.output) / 1_000_000 : sum;
  }, 0);
  const unknownModels = [...new Set(jobs.map((j) => j.model).filter((m) => !PRICES[m]))];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI設定</CardTitle>
          <CardDescription>設定の変更は Amplify の環境変数と SSM パラメータストアで行います（構築手順書 v0.4.0 参照）。</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-[180px_1fr]">
            <dt className="text-muted-foreground">状態</dt>
            <dd>
              <Badge variant={configured ? "default" : "destructive"}>{configured ? "有効" : "API キー未設定"}</Badge>
            </dd>
            <dt className="text-muted-foreground">API キーの保管場所</dt>
            <dd>{keySource}</dd>
            <dt className="text-muted-foreground">モデル</dt>
            <dd className="font-mono">{AI_MODEL}</dd>
            <dt className="text-muted-foreground">受講者の再分析間隔</dt>
            <dd>10分に1回まで</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">今月の利用状況</CardTitle>
          <CardDescription>
            費用の目安：約 ${cost.toFixed(2)}
            {unknownModels.length > 0 && `（${unknownModels.join(", ")} は料金未登録のため含まず）`}
            。実際の請求は Claude Console で確認してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>機能</TableHead>
                <TableHead className="text-right">実行回数</TableHead>
                <TableHead className="text-right">失敗</TableHead>
                <TableHead className="text-right">入力トークン</TableHead>
                <TableHead className="text-right">出力トークン</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byType.map((r) => (
                <TableRow key={r.type}>
                  <TableCell>{AI_JOB_TYPE_LABELS[r.type]}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-right">{r.failed || "—"}</TableCell>
                  <TableCell className="text-right">{r.input.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{r.output.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">最近の実行履歴</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">今月の実行履歴はありません。</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日時</TableHead>
                  <TableHead>機能</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>対象</TableHead>
                  <TableHead className="text-right">トークン（入/出）</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((j) => (
                  <TableRow key={j.jobId}>
                    <TableCell>{formatDateTime(j.createdAt)}</TableCell>
                    <TableCell>{AI_JOB_TYPE_LABELS[j.type] ?? j.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={j.status === "completed" ? "default" : j.status === "failed" ? "destructive" : "outline"}
                      >
                        {j.status === "completed" ? "成功" : j.status === "failed" ? "失敗" : "実行中"}
                      </Badge>
                      {j.error && <p className="mt-1 text-xs text-destructive">{j.error}</p>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {j.contentId ?? j.userId ?? "全体"}
                    </TableCell>
                    <TableCell className="text-right">
                      {j.inputTokens !== undefined ? `${j.inputTokens.toLocaleString()} / ${(j.outputTokens ?? 0).toLocaleString()}` : "—"}
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
