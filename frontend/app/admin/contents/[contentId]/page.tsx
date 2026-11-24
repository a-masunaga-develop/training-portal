import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentForm } from "@/components/admin/content-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { TestManager } from "@/components/admin/test-manager";
import { getContent, listPhases, listTestsByContent } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function EditContentPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const [content, phases, tests] = await Promise.all([
    getContent(contentId),
    listPhases(),
    listTestsByContent(contentId),
  ]);
  if (!content) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/contents" className="text-sm text-muted-foreground hover:underline">
          ← コンテンツ一覧
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/contents/${content.contentId}`}>受講画面でプレビュー</Link>
          </Button>
          <DeleteButton
            url={`/api/admin/contents/${encodeURIComponent(content.contentId)}`}
            confirmMessage={`コンテンツ「${content.title}」と、その問題（${tests.length}問）を削除しますか？`}
            redirectTo="/admin/contents"
            label="コンテンツを削除"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">コンテンツ</CardTitle>
          <p className="font-mono text-xs text-muted-foreground">{content.contentId}</p>
        </CardHeader>
        <CardContent>
          <ContentForm phases={phases} content={content} />
        </CardContent>
      </Card>

      <TestManager contentId={content.contentId} passScore={content.passScore} tests={tests} />
    </div>
  );
}
