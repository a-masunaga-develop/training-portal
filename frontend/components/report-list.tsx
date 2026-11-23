import { Badge } from "@/components/ui/badge";
import { UNDERSTANDING_LABELS } from "@/lib/format";
import type { Report } from "@/lib/types";

export function ReportList({
  reports,
  userNames,
}: {
  reports: Report[];
  /** 管理画面で受講者名を表示する場合に渡す */
  userNames?: Record<string, string>;
}) {
  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">日報はまだありません。</p>;
  }

  return (
    <ul className="divide-y">
      {reports.map((r) => (
        <li key={r.reportId} className="space-y-2 py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{r.date}</span>
            {userNames && <span>{userNames[r.userId] ?? r.userId}</span>}
            <Badge variant="secondary">{r.hours}時間</Badge>
            <Badge variant="outline">理解度 {UNDERSTANDING_LABELS[r.understanding] ?? r.understanding}</Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm">{r.content}</p>
          {r.comment && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">コメント：{r.comment}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
