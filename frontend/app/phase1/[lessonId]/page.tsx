import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompleteLessonButton } from "@/components/complete-lesson-button";
import { CURRENT_USER_ID } from "@/lib/constants";
import { LESSONS, getLesson } from "@/lib/content";
import { getProgress } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();

  const progress = await getProgress(CURRENT_USER_ID);
  const done = progress.completedLessons.includes(lesson.id);
  const index = LESSONS.findIndex((l) => l.id === lesson.id);
  const next = LESSONS[index + 1];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/phase1" className="text-sm text-muted-foreground hover:underline">
          ← Phase1 一覧へ
        </Link>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-sm text-muted-foreground">{lesson.summary}</p>
      </div>

      {lesson.sections.map((section) => (
        <Card key={section.heading}>
          <CardHeader>
            <CardTitle className="text-lg">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed">
            {section.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ポイント</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {lesson.keyPoints.map((k) => (
            <Badge key={k} variant="secondary">
              {k}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <CompleteLessonButton lessonId={lesson.id} done={done} />
        {next ? (
          <Button asChild variant="outline">
            <Link href={`/phase1/${next.id}`}>次へ：{next.title}</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/test">テストを受験する</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
