"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendJson } from "@/lib/client-api";

type Props = {
  url: string;
  confirmMessage: string;
  /** 削除後の遷移先（省略時は再読み込み） */
  redirectTo?: string;
  label?: string;
  size?: "sm" | "default";
};

export function DeleteButton({ url, confirmMessage, redirectTo, label = "削除", size = "sm" }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!window.confirm(confirmMessage)) return;
    startTransition(async () => {
      setError(null);
      const res = await sendJson(url, "DELETE");
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    });
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" variant="destructive" size={size} onClick={onClick} disabled={pending}>
        {pending ? "削除中..." : label}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </span>
  );
}
