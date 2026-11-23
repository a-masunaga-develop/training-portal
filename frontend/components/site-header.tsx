"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "ダッシュボード" },
  { href: "/phase1", label: "Phase1" },
  { href: "/test", label: "テスト" },
  { href: "/reports", label: "日報" },
  { href: "/admin", label: "管理画面" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-bold">
          研修ポータル
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {NAV.map((item) => (
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
      </div>
    </header>
  );
}
