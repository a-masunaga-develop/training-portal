"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendJson } from "@/lib/client-api";
import { CONTENT_TYPE_LABELS, CONTENT_TYPES, type Content, type ContentType, type Phase } from "@/lib/types";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

const URL_HINTS: Record<ContentType, string> = {
  text: "任意。参考資料などのリンク",
  video: "必須。YouTube の URL は画面に埋め込み表示、それ以外（Udemy など）はリンクで開きます",
  external: "必須。AWS Skill Builder、Progate などの教材 URL",
  pdf: "必須。PDF の URL",
  assignment: "任意。課題のリポジトリや資料の URL",
  exam: "任意",
};

type Props = {
  phases: Phase[];
  content?: Content;
  defaultPhaseId?: string;
  /** 新規作成時、フェーズごとの次の表示順 */
  nextOrders?: Record<string, number>;
};

export function ContentForm({ phases, content, defaultPhaseId, nextOrders }: Props) {
  const router = useRouter();
  const [type, setType] = useState<ContentType>(content?.type ?? "video");
  const [phaseId, setPhaseId] = useState(content?.phaseId ?? defaultPhaseId ?? phases[0]?.phaseId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      phaseId,
      type,
      url: form.get("url"),
      body: form.get("body"),
      passScore: Number(form.get("passScore")),
      order: Number(form.get("order")),
      published: form.get("published") === "on",
    };

    startTransition(async () => {
      setError(null);
      setMessage(null);
      const res = content
        ? await sendJson<Content>(`/api/admin/contents/${encodeURIComponent(content.contentId)}`, "PUT", payload)
        : await sendJson<Content>("/api/admin/contents", "POST", payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (content) {
        setMessage("保存しました");
        router.refresh();
      } else {
        // 登録後は編集画面へ移動し、続けて問題を登録できるようにする
        router.push(`/admin/contents/${res.data.contentId}`);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">タイトル</Label>
        <Input id="title" name="title" defaultValue={content?.title} required />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">説明</Label>
        <Textarea id="description" name="description" rows={2} defaultValue={content?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="phaseId">対象Phase</Label>
          <select id="phaseId" value={phaseId} onChange={(e) => setPhaseId(e.target.value)} className={SELECT_CLASS}>
            {phases.map((p) => (
              <option key={p.phaseId} value={p.phaseId}>
                {p.title}
                {p.published ? "" : "（非公開）"}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">コンテンツ種別</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as ContentType)}
            className={SELECT_CLASS}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONTENT_TYPE_LABELS[t]}（{t}）
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" placeholder="https://" defaultValue={content?.url} />
        <p className="text-xs text-muted-foreground">{URL_HINTS[type]}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="body">本文</Label>
        <Textarea
          id="body"
          name="body"
          rows={type === "text" || type === "assignment" ? 14 : 5}
          defaultValue={content?.body}
          placeholder={"## 見出し\n本文を書きます。\n- 箇条書き"}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          「## 」で始まる行は見出し、「- 」で始まる行は箇条書きになります。動画の補足や課題の説明にも使えます。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="passScore">合格点</Label>
          <Input
            id="passScore"
            name="passScore"
            type="number"
            min="0"
            max="100"
            defaultValue={content?.passScore ?? 80}
            required
          />
          <p className="text-xs text-muted-foreground">問題がないコンテンツは「学習完了にする」ボタンで完了します。</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="order">表示順（Phase内）</Label>
          <Input
            key={content ? "edit" : phaseId}
            id="order"
            name="order"
            type="number"
            min="0"
            defaultValue={content?.order ?? nextOrders?.[phaseId] ?? 1}
            required
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={content?.published ?? false} className="accent-primary" />
        公開する（受講者に表示する）
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : content ? "保存する" : "登録して問題の登録へ進む"}
        </Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {error && <p className="whitespace-pre-line text-sm text-destructive">{error}</p>}
      </div>
    </form>
  );
}
