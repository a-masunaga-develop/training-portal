"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/ai", label: "AIテスト生成" },
  { href: "/admin/ai/report", label: "AIレポート" },
  { href: "/admin/ai/analysis", label: "AI理解度分析" },
  { href: "/admin/ai/settings", label: "AI設定" },
];

export function AiNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground",
            pathname === tab.href && "bg-muted font-medium text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
