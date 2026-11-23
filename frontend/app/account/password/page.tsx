import { PasswordForm } from "@/components/password-form";
import { requireSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const user = await requireSessionUser();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold">パスワード変更</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <PasswordForm />
    </div>
  );
}
