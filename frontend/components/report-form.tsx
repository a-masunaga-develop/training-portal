"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UNDERSTANDING_LABELS } from "@/lib/format";

export function ReportForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      date: String(form.get("date") ?? ""),
      hours: Number(form.get("hours")),
      content: String(form.get("content") ?? ""),
      understanding: Number(form.get("understanding")),
      comment: String(form.get("comment") ?? ""),
    };

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "登録に失敗しました");
        return;
      }
      setMessage("日報を登録しました");
      setFormKey((k) => k + 1);
      router.refresh();
    });
  };

  return (
    <form key={formKey} onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="date">学習日</Label>
          <Input id="date" name="date" type="date" defaultValue={defaultDate} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="hours">学習時間（時間）</Label>
          <Input id="hours" name="hours" type="number" min="0.5" max="24" step="0.5" defaultValue="1" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="understanding">理解度</Label>
          <select
            id="understanding"
            name="understanding"
            defaultValue="3"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {Object.entries(UNDERSTANDING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="content">学習内容</Label>
        <Textarea id="content" name="content" rows={4} placeholder="例：IAM のユーザー・グループ・ロールの違いを学習した" required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="comment">コメント（任意）</Label>
        <Textarea id="comment" name="comment" rows={2} placeholder="質問や気づいたことなど" />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "登録中..." : "登録する"}
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {error && <p className="whitespace-pre-line text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}
