"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendJson } from "@/lib/client-api";

type Props = {
  url: string;
  label: string;
  pendingLabel?: string;
  variant?: "default" | "outline";
  size?: "sm" | "default";
};

/** AI 処理を実行し、終わったら画面を再読み込みする */
export function RunAiButton({ url, label, pendingLabel = "AI が分析しています...", variant = "default", size = "sm" }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setError(null);
    const res = await sendJson(url, "POST");
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" variant={variant} size={size} onClick={onClick} disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
      {pending && <span className="text-xs text-muted-foreground">30秒ほどかかることがあります</span>}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </span>
  );
}
