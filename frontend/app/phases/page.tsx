import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { requireSessionUser } from "@/lib/auth";
import { getCurriculum } from "@/lib/curriculum";
import { nextItem } from "@/lib/learning";
import { CONTENT_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PhasesPage() {
  const user = await requireSessionUser();
  const curriculum = await getCurriculum(user.userId);
  const next = nextItem(curriculum);

  // フェーズごとにまとめる（並び順は curriculum の順番のまま）
  const groups = new Map<string, typeof curriculum.items>();
  for (const item of curriculum.items) {
    const list = groups.get(item.phase.phaseId) ?? [];
    list.push(item);
    groups.set(item.phase.phaseId, list);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">学習コンテンツ</h1>
        <p className="text-sm text-muted-foreground">
          コンテンツを学習し、テストに合格すると次のコンテンツが解放されます。
        </p>
        <div className="flex items-center gap-3">
          <Progress value={curriculum.rate} className="max-w-xs" />
          <span className="text-sm text-muted-foreground">
            {curriculum.completedCount} / {curriculum.total} 完了（{curriculum.rate}%）
          </span>
        </div>
      </div>

      {curriculum.total === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">公開中のコンテンツはまだありません。</CardContent>
        </Card>
      )}

      {[...groups.values()].map((items) => {
        const phase = items[0].phase;
        const done = items.filter((i) => i.status === "completed").length;
        return (
          <section key={phase.phaseId} className="space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{phase.title}</h2>
                <Badge variant="outline">
                  {done} / {items.length}
                </Badge>
              </div>
              {phase.description && <p className="text-sm text-muted-foreground">{phase.description}</p>}
            </div>

            <div className="grid gap-3">
              {items.map((item) => {
                const locked = !item.unlocked && !user.isAdmin;
                const isNext = next?.content.contentId === item.content.contentId;
                const card = (
                  <Card
                    className={cn(
                      "transition-colors",
                      locked ? "opacity-60" : "hover:border-foreground/30",
                      isNext && "border-primary",
                    )}
                  >
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {item.position}. {item.content.title}
                          </CardTitle>
                          <CardDescription>{item.content.description}</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isNext && <Badge>次に学習</Badge>}
                          <Badge variant="outline">{CONTENT_TYPE_LABELS[item.content.type]}</Badge>
                          <StatusBadge status={item.status} locked={locked} />
                        </div>
                      </div>
                      {item.score !== undefined && (
                        <p className="text-xs text-muted-foreground">最高得点 {item.score}点</p>
                      )}
                    </CardHeader>
                  </Card>
                );
                return locked ? (
                  <div key={item.content.contentId} aria-disabled title="前のコンテンツを完了すると解放されます">
                    {card}
                  </div>
                ) : (
                  <Link key={item.content.contentId} href={`/contents/${item.content.contentId}`}>
                    {card}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
