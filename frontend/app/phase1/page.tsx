import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireSessionUser } from "@/lib/auth";
import { LESSONS } from "@/lib/content";
import { getProgress } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function Phase1Page() {
  const user = await requireSessionUser();
  const progress = await getProgress(user.userId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Phase1 学習コンテンツ</h1>
        <p className="text-sm text-muted-foreground">AWS の基礎となる4つのテーマを学習します。</p>
        <div className="flex items-center gap-3">
          <Progress value={progress.completed} className="max-w-xs" />
          <span className="text-sm text-muted-foreground">{progress.completed}%</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson, i) => {
          const done = progress.completedLessons.includes(lesson.id);
          return (
            <Link key={lesson.id} href={`/phase1/${lesson.id}`} className="group">
              <Card className="h-full transition-colors group-hover:border-foreground/30">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>
                      {i + 1}. {lesson.title}
                    </CardTitle>
                    <Badge variant={done ? "default" : "outline"}>{done ? "完了" : "未完了"}</Badge>
                  </div>
                  <CardDescription>{lesson.summary}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
