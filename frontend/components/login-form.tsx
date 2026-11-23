"use client";

import { confirmSignIn, signIn, signOut } from "aws-amplify/auth";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage, safeNextPath } from "@/lib/auth-errors";

type Step = "signIn" | "newPassword";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const [step, setStep] = useState<Step>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // サーバー側でもセッションを読めるよう、ページ全体を再読み込みして遷移する
  const goNext = () => window.location.assign(next);

  const handle = async (fn: () => Promise<void>) => {
    setError(null);
    setPending(true);
    try {
      await fn();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  const onSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    handle(async () => {
      let result;
      try {
        result = await signIn({ username: email, password });
      } catch (err) {
        // 別ユーザーのセッションが残っている場合はサインアウトしてやり直す
        if (err instanceof Error && err.name === "UserAlreadyAuthenticatedException") {
          await signOut();
          result = await signIn({ username: email, password });
        } else {
          throw err;
        }
      }

      if (result.isSignedIn) return goNext();
      if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setStep("newPassword");
        return;
      }
      throw new Error(`未対応のサインイン手順です: ${result.nextStep.signInStep}`);
    });
  };

  const onNewPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirmPassword") ?? "");
    if (password !== confirm) {
      setError("確認用パスワードが一致しません");
      return;
    }

    handle(async () => {
      const result = await confirmSignIn({ challengeResponse: password });
      if (result.isSignedIn) return goNext();
      throw new Error(`未対応のサインイン手順です: ${result.nextStep.signInStep}`);
    });
  };

  if (step === "newPassword") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>新しいパスワードの設定</CardTitle>
          <CardDescription>初回ログインのため、新しいパスワードを設定してください。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onNewPassword} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">新しいパスワード</Label>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
              <p className="text-xs text-muted-foreground">8文字以上、英大文字・英小文字・数字を含めてください</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "設定中..." : "設定してログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ログイン</CardTitle>
        <CardDescription>研修ポータルにログインします。</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSignIn} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">パスワード</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
