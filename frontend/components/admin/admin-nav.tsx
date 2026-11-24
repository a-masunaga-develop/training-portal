"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "概要" },
  { href: "/admin/phases", label: "Phase管理" },
  { href: "/admin/contents", label: "コンテンツ・テスト管理" },
  { href: "/admin/students", label: "受講者・進捗管理" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav className="flex flex-wrap gap-1 border-b text-sm">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "-mb-px border-b-2 border-transparent px-3 py-2 text-muted-foreground hover:text-foreground",
            isActive(tab.href) && "border-foreground font-medium text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
