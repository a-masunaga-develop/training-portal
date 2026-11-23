"use client";

import { updatePassword } from "aws-amplify/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth-errors";

export function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const oldPassword = String(form.get("oldPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");

    setError(null);
    setMessage(null);
    if (newPassword !== confirm) {
      setError("確認用パスワードが一致しません");
      return;
    }

    setPending(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      setMessage("パスワードを変更しました");
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "NotAuthorizedException"
          ? "現在のパスワードが正しくありません"
          : authErrorMessage(err),
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form key={formKey} onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="oldPassword">現在のパスワード</Label>
            <Input id="oldPassword" name="oldPassword" type="password" autoComplete="current-password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">新しいパスワード</Label>
            <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
            <p className="text-xs text-muted-foreground">8文字以上、英大文字・英小文字・数字を含めてください</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "変更中..." : "変更する"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
