import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompleteContentButton } from "@/components/complete-content-button";
import { ContentLocked } from "@/components/content-locked";
import { ContentViewer } from "@/components/content-viewer";
import { MarkStatus } from "@/components/mark-status";
import { StatusBadge } from "@/components/status-badge";
import { requireSessionUser } from "@/lib/auth";
import { checkContentAccess } from "@/lib/curriculum";
import { listTestsByContent } from "@/lib/repository";
import { CONTENT_TYPE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const user = await requireSessionUser();
  const access = await checkContentAccess(user, contentId);

  if (!access.ok) {
    if (access.reason === "not_found") notFound();
    return <ContentLocked title={access.content?.title} previous={access.previous} />;
  }

  const { content, phase, item, curriculum } = access;
  const tests = await listTestsByContent(content.contentId);
  const status = item?.status ?? "not_started";
  const completed = status === "completed";
  const next = item ? curriculum.items[item.position] : undefined;

  return (
    <div className="space-y-6">
      {item && <MarkStatus contentId={content.contentId} status="learning" />}

      <div className="space-y-2">
        <Link href="/phases" className="text-sm text-muted-foreground hover:underline">
          ← {phase.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <Badge variant="outline">{CONTENT_TYPE_LABELS[content.type]}</Badge>
          {item ? <StatusBadge status={status} /> : <Badge variant="secondary">プレビュー（非公開）</Badge>}
        </div>
        {content.description && <p className="text-sm text-muted-foreground">{content.description}</p>}
      </div>

      <ContentViewer content={content} />

      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          {tests.length > 0 ? (
            <>
              <p>
                理解度テスト（全{tests.length}問）で <strong>{content.passScore}点以上</strong>{" "}
                を取ると、このコンテンツは完了になります。
                {item?.score !== undefined && <span className="text-muted-foreground">（最高得点 {item.score}点）</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant={completed ? "outline" : "default"}>
                  <Link href={`/contents/${content.contentId}/test`}>
                    {completed ? "もう一度テストを受ける" : "理解度テストを受ける"}
                  </Link>
                </Button>
                {completed && next && (
                  <Button asChild>
                    <Link href={`/contents/${next.content.contentId}`}>次へ：{next.content.title}</Link>
                  </Button>
                )}
              </div>
            </>
          ) : completed ? (
            <div className="flex flex-wrap items-center gap-3">
              <p>このコンテンツは完了しています。</p>
              {next && (
                <Button asChild>
                  <Link href={`/contents/${next.content.contentId}`}>次へ：{next.content.title}</Link>
                </Button>
              )}
            </div>
          ) : item ? (
            <>
              <p>学習が終わったら「学習完了にする」を押してください。</p>
              <CompleteContentButton contentId={content.contentId} />
            </>
          ) : (
            <p className="text-muted-foreground">非公開のコンテンツです。公開すると受講者が学習できます。</p>
          )}
          {completed && !next && item && (
            <p className="text-muted-foreground">公開中のコンテンツはすべて完了しました。お疲れさまでした！</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
