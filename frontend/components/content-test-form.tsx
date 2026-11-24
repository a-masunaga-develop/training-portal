"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicTest, TestResult } from "@/lib/types";

type Props = {
  contentId: string;
  tests: PublicTest[];
  next?: { contentId: string; title: string };
};

export function ContentTestForm({ contentId, tests, next }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === tests.length;

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/contents/${encodeURIComponent(contentId)}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "採点に失敗しました");
        return;
      }
      setResult(body as TestResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
      router.refresh();
    });

  const retry = () => {
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <Card className={result.passed ? "border-primary" : "border-destructive"}>
          <CardHeader>
            <CardDescription>
              採点結果（{result.attempts}回目）・合格点 {result.passScore}点
            </CardDescription>
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-3xl">{result.score}点</CardTitle>
              <Badge variant={result.passed ? "default" : "destructive"} className="text-sm">
                {result.passed ? "合格" : "不合格"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {result.correctCount} / {result.total} 問正解。
              {result.passed
                ? "このコンテンツは完了です。"
                : "解説を確認して、もう一度挑戦してください。"}
            </p>
            <div className="flex flex-wrap gap-2">
              {result.passed && next && (
                <Button asChild>
                  <Link href={`/contents/${next.contentId}`}>次へ：{next.title}</Link>
                </Button>
              )}
              {result.passed && !next && (
                <Button asChild>
                  <Link href="/">ダッシュボードへ</Link>
                </Button>
              )}
              <Button variant="outline" onClick={retry}>
                もう一度受験する
              </Button>
              {!result.passed && (
                <Button asChild variant="ghost">
                  <Link href={`/contents/${contentId}`}>教材を見直す</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {result.details.map((d, i) => (
          <Card key={d.testId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  問{i + 1}. {d.question}
                </CardTitle>
                <Badge variant={d.correct ? "default" : "destructive"}>{d.correct ? "正解" : "不正解"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>あなたの回答：{d.selected === null ? "未回答" : d.choices[d.selected]}</p>
              {!d.correct && <p>正解：{d.choices[d.answer]}</p>}
              {d.explanation && <p className="text-muted-foreground">解説：{d.explanation}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((t, i) => (
        <Card key={t.testId}>
          <CardHeader>
            <CardTitle className="text-base">
              問{i + 1}. {t.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset className="grid gap-2">
              <legend className="sr-only">{t.question}</legend>
              {t.choices.map((choice, ci) => {
                const checked = answers[t.testId] === ci;
                return (
                  <label
                    key={ci}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted",
                      checked && "border-primary bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name={t.testId}
                      checked={checked}
                      onChange={() => setAnswers((prev) => ({ ...prev, [t.testId]: ci }))}
                      className="accent-primary"
                    />
                    {choice}
                  </label>
                );
              })}
            </fieldset>
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!allAnswered || pending}>
          {pending ? "採点中..." : "採点する"}
        </Button>
        <span className="text-sm text-muted-foreground">
          回答済み {answeredCount} / {tests.length}
        </span>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
