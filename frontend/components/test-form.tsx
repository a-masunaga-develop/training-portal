"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicTest, TestResult } from "@/lib/types";

export function TestForm({ tests }: { tests: PublicTest[] }) {
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
      const res = await fetch("/api/test-results", {
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
        <Card>
          <CardHeader>
            <CardDescription>採点結果</CardDescription>
            <CardTitle className="text-3xl">{result.score}点</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {result.correctCount} / {result.total} 問正解
            </span>
            <Button variant="outline" size="sm" onClick={retry}>
              もう一度受験する
            </Button>
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
              <p>
                あなたの回答：{d.selected === null ? "未回答" : d.choices[d.selected]}
              </p>
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
