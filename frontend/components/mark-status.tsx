"use client";

import { useEffect } from "react";

/** 画面を開いたときに受講状態（受講中・テスト受験中）を記録する */
export function MarkStatus({ contentId, status }: { contentId: string; status: "learning" | "testing" }) {
  useEffect(() => {
    fetch(`/api/contents/${encodeURIComponent(contentId)}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {
      // 記録に失敗しても学習は続けられるため、画面には表示しない
    });
  }, [contentId, status]);
  return null;
}
