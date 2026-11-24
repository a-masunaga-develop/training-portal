"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

/** テストのないコンテンツを完了にする */
export function CompleteContentButton({ contentId }: { contentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      const res = await fetch(`/api/contents/${encodeURIComponent(contentId)}/complete`, { method: "POST" });
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
