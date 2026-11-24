"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "@/components/admin/delete-button";
import { sendJson } from "@/lib/client-api";
import type { Test } from "@/lib/types";

function TestForm({
  contentId,
  test,
  defaultOrder,
  onDone,
}: {
  contentId: string;
  test?: Test;
  defaultOrder: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [choices, setChoices] = useState<string[]>(test?.choices ?? ["", "", "", ""]);
  const [answer, setAnswer] = useState<number>(test?.answer ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const updateChoice = (i: number, value: string) =>
    setChoices((prev) => prev.map((c, j) => (j === i ? value : c)));
  const removeChoice = (i: number) => {
    setChoices((prev) => prev.filter((_, j) => j !== i));
    setAnswer((a) => (a === i ? 0 : a > i ? a - 1 : a));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      contentId,
      question: form.get("question"),
      choices,
      answer,
      explanation: form.get("explanation"),
      order: Number(form.get("order")),
    };
    startTransition(async () => {
      setError(null);
      const res = test
        ? await sendJson(`/api/admin/tests/${encodeURIComponent(test.testId)}`, "PUT", payload)
        : await sendJson("/api/admin/tests", "POST", payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onDone();
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div className="grid gap-2">
          <Label htmlFor="question">問題文</Label>
          <Textarea id="question" name="question" rows={2} defaultValue={test?.question} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="test-order">表示順</Label>
          <Input id="test-order" name="order" type="number" min="0" defaultValue={test?.order ?? defaultOrder} required />
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">選択肢（正解を選んでください）</legend>
        {choices.map((choice, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="answer"
              checked={answer === i}
              onChange={() => setAnswer(i)}
              className="accent-primary"
              aria-label={`選択肢${i + 1}を正解にする`}
            />
            <Input
              value={choice}
              onChange={(e) => updateChoice(i, e.target.value)}
              placeholder={`選択肢${i + 1}`}
              required
            />
            {choices.length > 2 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeChoice(i)}>
                削除
              </Button>
            )}
          </div>
        ))}
        {choices.length < 6 && (
          <div>
            <Button type="button" variant="outline" size="sm" onClick={() => setChoices((prev) => [...prev, ""])}>
              選択肢を追加
            </Button>
          </div>
        )}
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="explanation">解説</Label>
        <Textarea id="explanation" name="explanation" rows={2} defaultValue={test?.explanation} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : test ? "更新する" : "登録する"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          キャンセル
        </Button>
        {error && <p className="whitespace-pre-line text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}

export function TestManager({ contentId, passScore, tests }: { contentId: string; passScore: number; tests: Test[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const nextOrder = tests.length === 0 ? 1 : Math.max(...tests.map((t) => t.order ?? 0)) + 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">理解度テスト（{tests.length}問）</CardTitle>
            <p className="text-sm text-muted-foreground">
              {tests.length === 0
                ? "問題がない場合、受講者は「学習完了にする」で完了できます。"
                : `${passScore}点以上で合格。推奨は3〜5問です。`}
            </p>
          </div>
          {editing !== "new" && <Button onClick={() => setEditing("new")}>問題を追加</Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing === "new" && (
          <div className="rounded-lg border p-4">
            <TestForm contentId={contentId} defaultOrder={nextOrder} onDone={() => setEditing(null)} />
          </div>
        )}

        {tests.map((t, i) =>
          editing === t.testId ? (
            <div key={t.testId} className="rounded-lg border p-4">
              <TestForm contentId={contentId} test={t} defaultOrder={t.order} onDone={() => setEditing(null)} />
            </div>
          ) : (
            <div key={t.testId} className="space-y-2 rounded-lg border p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">
                  問{i + 1}. {t.question}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(t.testId)}>
                    編集
                  </Button>
                  <DeleteButton
                    url={`/api/admin/tests/${encodeURIComponent(t.testId)}`}
                    confirmMessage={`問${i + 1}を削除しますか？`}
                  />
                </div>
              </div>
              <ol className="list-decimal space-y-1 pl-5">
                {t.choices.map((c, ci) => (
                  <li key={ci} className={ci === t.answer ? "font-medium" : "text-muted-foreground"}>
                    {c} {ci === t.answer && <Badge className="ml-1">正解</Badge>}
                  </li>
                ))}
              </ol>
              {t.explanation && <p className="text-muted-foreground">解説：{t.explanation}</p>}
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}
