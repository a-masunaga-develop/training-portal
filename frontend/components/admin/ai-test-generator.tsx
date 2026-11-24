"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendJson } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Question = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  topic: string;
  selected: boolean;
};

type Props = {
  contentId: string;
  initialTranscript: string;
  hasBody: boolean;
};

type Busy = null | "save" | "topics" | "questions" | "register";

/** 1回の API 呼び出しで生成する問題数（サーバー側 MAX_QUESTIONS_PER_CALL と合わせる） */
const BATCH_SIZE = 3;

const BUSY_LABELS: Record<Exclude<Busy, null>, string> = {
  save: "保存中...",
  topics: "AI が学習ポイントを抽出しています（10〜30秒ほどかかります）...",
  questions: "AI が問題を作成しています（3問ごとに15〜25秒ほどかかります）...",
  register: "問題を登録しています...",
};

export function AiTestGenerator({ contentId, initialTranscript, hasBody }: Props) {
  const router = useRouter();
  const base = `/api/admin/ai/contents/${encodeURIComponent(contentId)}`;

  const [transcript, setTranscript] = useState(initialTranscript);
  const [savedTranscript, setSavedTranscript] = useState(initialTranscript);
  const [summary, setSummary] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const run = async (kind: Exclude<Busy, null>, fn: () => Promise<string | void>) => {
    setBusy(kind);
    setError(null);
    setMessage(null);
    try {
      const err = await fn();
      if (err) setError(err);
    } finally {
      setBusy(null);
    }
  };

  /** 字幕に変更があれば先に保存する（AI はサーバーに保存された内容を使う） */
  const saveTranscriptIfChanged = async (): Promise<string | void> => {
    if (transcript === savedTranscript) return;
    const res = await sendJson(`${base}/transcript`, "PUT", { transcript });
    if (!res.ok) return res.error;
    setSavedTranscript(transcript);
  };

  const onSaveTranscript = () =>
    run("save", async () => {
      const err = await saveTranscriptIfChanged();
      if (err) return err;
      setMessage("字幕・教材テキストを保存しました");
    });

  const onExtract = () =>
    run("topics", async () => {
      const err = await saveTranscriptIfChanged();
      if (err) return err;
      const res = await sendJson<{ summary: string; topics: string[] }>(`${base}/topics`, "POST");
      if (!res.ok) return res.error;
      setSummary(res.data.summary);
      setTopics(res.data.topics);
      setQuestions([]);
    });

  const onGenerate = () =>
    run("questions", async () => {
      const err = await saveTranscriptIfChanged();
      if (err) return err;
      setQuestions([]);

      // 時間切れを避けるため、少しずつ分けて生成する（前に作った問題と重ならないよう伝える）
      const generated: Omit<Question, "selected">[] = [];
      while (generated.length < count) {
        setProgress(`${generated.length} / ${count} 問`);
        const res = await sendJson<{ questions: Omit<Question, "selected">[] }>(`${base}/questions`, "POST", {
          topics,
          count: Math.min(BATCH_SIZE, count - generated.length),
          avoid: generated.map((q) => q.question),
        });
        if (!res.ok) {
          // それまでに生成できた分は残す
          setQuestions(generated.map((q) => ({ ...q, selected: true })));
          setProgress(null);
          return generated.length ? `${generated.length}問まで生成しました。続きでエラー：${res.error}` : res.error;
        }
        if (res.data.questions.length === 0) break;
        generated.push(...res.data.questions);
        setQuestions(generated.map((q) => ({ ...q, selected: true })));
      }
      setProgress(null);
    });

  const onRegister = () =>
    run("register", async () => {
      const selected = questions.filter((q) => q.selected);
      const res = await sendJson<unknown[]>("/api/admin/tests/bulk", "POST", {
        contentId,
        questions: selected.map(({ question, choices, answer, explanation }) => ({
          question,
          choices,
          answer,
          explanation,
        })),
      });
      if (!res.ok) return res.error;
      setQuestions([]);
      setMessage(`${selected.length}問を登録しました。上の「理解度テスト」で確認できます`);
      router.refresh();
    });

  const updateQuestion = (i: number, patch: Partial<Question>) =>
    setQuestions((prev) => prev.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  const addTopic = () => {
    const t = newTopic.trim();
    if (t && !topics.includes(t)) setTopics((prev) => [...prev, t]);
    setNewTopic("");
  };

  const selectedCount = questions.filter((q) => q.selected).length;
  const disabled = busy !== null;
  const hasSource = hasBody || transcript.trim().length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-lg">AIテスト生成</CardTitle>
          <Badge variant="secondary">Claude</Badge>
        </div>
        <CardDescription>
          教材の本文と、下の字幕・教材テキストから、AI が学習ポイントを抽出して4択問題を作成します。
          生成された問題は確認・編集してから登録してください。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 1. 字幕・教材テキスト */}
        <section className="grid gap-2">
          <Label htmlFor="transcript">1. 字幕・教材テキスト</Label>
          <Textarea
            id="transcript"
            rows={8}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="動画の文字起こしや教材の本文を貼り付けます。YouTube は動画ページの「…」→「文字起こしを表示」からコピーできます。"
            className="text-sm"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{transcript.length.toLocaleString()}文字</span>
            {transcript !== savedTranscript && <Badge variant="outline">未保存</Badge>}
            <Button type="button" variant="outline" size="sm" onClick={onSaveTranscript} disabled={disabled}>
              保存
            </Button>
            <span>受講者には表示されません。本文だけで十分な場合は空欄でもかまいません。</span>
          </div>
        </section>

        {/* 2. 学習ポイント */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">2. 学習ポイント</p>
            <Button type="button" onClick={onExtract} disabled={disabled || !hasSource}>
              {topics.length ? "抽出し直す" : "学習ポイントを抽出"}
            </Button>
          </div>
          {!hasSource && (
            <p className="text-sm text-muted-foreground">本文または字幕・教材テキストを入力すると抽出できます。</p>
          )}
          {summary && <p className="rounded-md bg-muted p-3 text-sm">{summary}</p>}
          {topics.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 py-1 text-sm">
                    {t}
                    <button
                      type="button"
                      onClick={() => setTopics((prev) => prev.filter((x) => x !== t))}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                      aria-label={`${t}を削除`}
                      disabled={disabled}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex max-w-md gap-2">
                <Input
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTopic();
                    }
                  }}
                  placeholder="学習ポイントを追加"
                />
                <Button type="button" variant="outline" onClick={addTopic} disabled={disabled}>
                  追加
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* 3. 問題生成 */}
        {topics.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium">3. 問題を生成</p>
              <label className="flex items-center gap-2 text-sm">
                問題数
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  disabled={disabled}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}問
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" onClick={onGenerate} disabled={disabled}>
                {questions.length ? "再生成" : "問題を生成"}
              </Button>
            </div>
          </section>
        )}

        {busy && (
          <p className="text-sm text-muted-foreground">
            {BUSY_LABELS[busy]}
            {busy === "questions" && progress && `（生成済み ${progress}）`}
          </p>
        )}
        {error && <p className="whitespace-pre-line text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        {/* 4. 確認・編集・登録 */}
        {questions.length > 0 && (
          <section className="space-y-4">
            <p className="text-sm font-medium">4. 確認・編集して登録</p>
            {questions.map((q, i) => (
              <div
                key={i}
                className={cn("space-y-3 rounded-lg border p-4", !q.selected && "opacity-50")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={q.selected}
                      onChange={(e) => updateQuestion(i, { selected: e.target.checked })}
                      className="accent-primary"
                    />
                    問{i + 1}を登録する
                  </label>
                  {q.topic && <Badge variant="outline">{q.topic}</Badge>}
                </div>
                <Textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => updateQuestion(i, { question: e.target.value })}
                  aria-label={`問${i + 1}の問題文`}
                />
                <div className="grid gap-2">
                  {q.choices.map((c, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`ai-answer-${i}`}
                        checked={q.answer === ci}
                        onChange={() => updateQuestion(i, { answer: ci })}
                        className="accent-primary"
                        aria-label={`選択肢${ci + 1}を正解にする`}
                      />
                      <Input
                        value={c}
                        onChange={(e) =>
                          updateQuestion(i, { choices: q.choices.map((x, xi) => (xi === ci ? e.target.value : x)) })
                        }
                      />
                      {q.answer === ci && <Badge>正解</Badge>}
                    </div>
                  ))}
                </div>
                <Textarea
                  rows={2}
                  value={q.explanation}
                  onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
                  aria-label={`問${i + 1}の解説`}
                  className="text-sm"
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={onRegister} disabled={disabled || selectedCount === 0}>
                選択した{selectedCount}問を登録
              </Button>
              <span className="text-xs text-muted-foreground">
                AI の出力には誤りが含まれることがあります。正解と解説を必ず確認してください。
              </span>
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
