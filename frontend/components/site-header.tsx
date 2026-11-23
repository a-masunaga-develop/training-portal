"use client";

import { signOut } from "aws-amplify/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "ダッシュボード", adminOnly: false },
  { href: "/phase1", label: "Phase1", adminOnly: false },
  { href: "/test", label: "テスト", adminOnly: false },
  { href: "/reports", label: "日報", adminOnly: false },
  { href: "/admin", label: "管理画面", adminOnly: true },
];

type HeaderUser = { email: string; isAdmin: boolean } | null;

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      // Cookie を消した状態でサーバーから描画し直す
      window.location.assign("/login");
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-bold">
          研修ポータル
        </Link>

        {user && (
          <>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.filter((item) => !item.adminOnly || user.isAdmin).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
                    isActive(item.href) && "bg-muted font-medium text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                {user.email}
                {user.isAdmin && "（管理者）"}
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link href="/account/password">パスワード変更</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={onSignOut} disabled={signingOut}>
                {signingOut ? "ログアウト中..." : "ログアウト"}
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
