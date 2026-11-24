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
import type { Phase } from "@/lib/types";

function PhaseForm({ phase, defaultOrder, onDone }: { phase?: Phase; defaultOrder: number; onDone: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      order: Number(form.get("order")),
      published: form.get("published") === "on",
    };
    startTransition(async () => {
      setError(null);
      const res = phase
        ? await sendJson(`/api/admin/phases/${encodeURIComponent(phase.phaseId)}`, "PUT", payload)
        : await sendJson("/api/admin/phases", "POST", payload);
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
          <Label htmlFor="phase-title">タイトル</Label>
          <Input id="phase-title" name="title" defaultValue={phase?.title} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phase-order">表示順</Label>
          <Input id="phase-order" name="order" type="number" min="0" defaultValue={phase?.order ?? defaultOrder} required />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phase-description">説明</Label>
        <Textarea id="phase-description" name="description" rows={2} defaultValue={phase?.description} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={phase?.published ?? false} className="accent-primary" />
        公開する（受講者に表示する）
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : phase ? "更新する" : "登録する"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          キャンセル
        </Button>
        {error && <p className="whitespace-pre-line text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}

export function PhaseManager({ phases, contentCounts }: { phases: Phase[]; contentCounts: Record<string, number> }) {
  // "new" = 新規作成フォーム、phaseId = 編集中
  const [editing, setEditing] = useState<string | null>(null);
  const nextOrder = phases.length === 0 ? 1 : Math.max(...phases.map((p) => p.order)) + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          フェーズは表示順に並びます。非公開のフェーズとそのコンテンツは受講者に表示されません。
        </p>
        {editing !== "new" && <Button onClick={() => setEditing("new")}>フェーズを追加</Button>}
      </div>

      {editing === "new" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">フェーズを追加</CardTitle>
          </CardHeader>
          <CardContent>
            <PhaseForm defaultOrder={nextOrder} onDone={() => setEditing(null)} />
          </CardContent>
        </Card>
      )}

      {phases.length === 0 && editing !== "new" && (
        <p className="text-sm text-muted-foreground">フェーズはまだありません。</p>
      )}

      {phases.map((phase) => (
        <Card key={phase.phaseId}>
          {editing === phase.phaseId ? (
            <CardContent className="pt-6">
              <PhaseForm phase={phase} defaultOrder={phase.order} onDone={() => setEditing(null)} />
            </CardContent>
          ) : (
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">#{phase.order}</span>
                    <CardTitle className="text-base">{phase.title}</CardTitle>
                    <Badge variant={phase.published ? "default" : "outline"}>
                      {phase.published ? "公開" : "非公開"}
                    </Badge>
                    <Badge variant="secondary">コンテンツ {contentCounts[phase.phaseId] ?? 0}件</Badge>
                  </div>
                  {phase.description && <p className="text-sm text-muted-foreground">{phase.description}</p>}
                  <p className="font-mono text-xs text-muted-foreground">{phase.phaseId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(phase.phaseId)}>
                    編集
                  </Button>
                  <DeleteButton
                    url={`/api/admin/phases/${encodeURIComponent(phase.phaseId)}`}
                    confirmMessage={`フェーズ「${phase.title}」を削除しますか？`}
                  />
                </div>
              </div>
            </CardHeader>
          )}
        </Card>
      ))}
    </div>
  );
}
