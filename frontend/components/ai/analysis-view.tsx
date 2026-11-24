import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UNDERSTANDING_LEVEL_LABELS, type Recommendation, type UnderstandingLevel } from "@/lib/ai/store";
import { formatDateTime } from "@/lib/format";

const LEVEL_VARIANTS: Record<UnderstandingLevel, "default" | "secondary" | "destructive" | "outline"> = {
  understood: "default",
  partial: "secondary",
  weak: "destructive",
  not_started: "outline",
};

type Props = {
  rec: Recommendation;
  /** contentId → タイトル */
  titles: Map<string, string>;
  /** 推奨コンテンツをリンクにするか（受講者画面） */
  linkContents?: boolean;
};

export function AnalysisView({ rec, titles, linkContents }: Props) {
  const title = (id: string) => titles.get(id) ?? id;

  return (
    <div className="space-y-5 text-sm">
      <p>{rec.summary}</p>

      {rec.recommendations.length > 0 && (
        <section className="space-y-2">
          <p className="font-medium">AIおすすめ教材</p>
          <ol className="space-y-2">
            {rec.recommendations.map((r, i) => (
              <li key={r.contentId} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={i === 0 ? "default" : "secondary"}>{i === 0 ? "次の推奨" : `候補${i + 1}`}</Badge>
                  {linkContents ? (
                    <Link href={`/contents/${r.contentId}`} className="font-medium underline-offset-4 hover:underline">
                      {title(r.contentId)}
                    </Link>
                  ) : (
                    <span className="font-medium">{title(r.contentId)}</span>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {rec.weaknesses.length > 0 && (
        <section className="space-y-2">
          <p className="font-medium">最近の弱点</p>
          <div className="flex flex-wrap gap-2">
            {rec.weaknesses.map((w) => (
              <Badge key={w} variant="outline">
                {w}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {rec.understanding.length > 0 && (
        <section className="space-y-2">
          <p className="font-medium">理解度分析</p>
          <ul className="divide-y rounded-md border">
            {rec.understanding.map((u) => (
              <li key={u.contentId} className="flex flex-wrap items-start justify-between gap-2 p-3">
                <div className="space-y-0.5">
                  <p>{title(u.contentId)}</p>
                  <p className="text-xs text-muted-foreground">{u.comment}</p>
                </div>
                <Badge variant={LEVEL_VARIANTS[u.level]}>{UNDERSTANDING_LEVEL_LABELS[u.level]}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rec.advice && <p className="rounded-md bg-muted p-3">💡 {rec.advice}</p>}

      <p className="text-xs text-muted-foreground">
        {formatDateTime(rec.generatedAt)} に AI が分析。AI の判断には誤りが含まれることがあります。
      </p>
    </div>
  );
}
