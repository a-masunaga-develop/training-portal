"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function CompleteLessonButton({ lessonId, done }: { lessonId: string; done: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <Button disabled variant="secondary">
        完了済み
      </Button>
    );
  }

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "保存に失敗しました");
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onClick} disabled={pending}>
        {pending ? "保存中..." : "学習完了にする"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
