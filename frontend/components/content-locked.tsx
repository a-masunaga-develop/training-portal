import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurriculumItem } from "@/lib/learning";

export function ContentLocked({ title, previous }: { title?: string; previous?: CurriculumItem }) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <p className="text-sm text-muted-foreground">🔒 未解放</p>
        <CardTitle>{title ?? "このコンテンツ"}はまだ受講できません</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">前のコンテンツを完了すると解放されます。</p>
        <div className="flex flex-wrap gap-2">
          {previous && (
            <Button asChild>
              <Link href={`/contents/${previous.content.contentId}`}>{previous.content.title} を学習する</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/phases">コンテンツ一覧へ</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
