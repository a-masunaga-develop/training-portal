import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContentBody } from "@/components/content-body";
import { CONTENT_TYPE_LABELS, type Content } from "@/lib/types";

/** YouTube の URL なら埋め込み用 URL を返す */
function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.hostname.endsWith("youtube.com")) {
      id = u.pathname.startsWith("/embed/") ? u.pathname.split("/")[2] : u.searchParams.get("v");
    }
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

const OPEN_LABELS: Partial<Record<Content["type"], string>> = {
  video: "動画を開く",
  external: "教材を開く",
  pdf: "PDFを開く",
  assignment: "課題を開く",
  exam: "試験を開く",
};

export function ContentViewer({ content }: { content: Content }) {
  const embed = content.type === "video" && content.url ? youtubeEmbedUrl(content.url) : null;

  return (
    <div className="space-y-4">
      {embed && (
        <div className="aspect-video overflow-hidden rounded-xl border bg-black">
          <iframe
            src={embed}
            title={content.title}
            className="h-full w-full"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {content.url && !embed && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
            <span className="text-muted-foreground">
              {CONTENT_TYPE_LABELS[content.type]}は外部サイトで開きます。学習が終わったらこの画面に戻ってください。
            </span>
            <Button asChild>
              <a href={content.url} target="_blank" rel="noopener noreferrer">
                {OPEN_LABELS[content.type] ?? "開く"} ↗
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <ContentBody body={content.body} />
    </div>
  );
}
