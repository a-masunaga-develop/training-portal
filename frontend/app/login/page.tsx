import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "ログイン | 研修ポータル" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm pt-8">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
