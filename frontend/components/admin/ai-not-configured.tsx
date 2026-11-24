import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function AiNotConfigured() {
  return (
    <Card>
      <CardContent className="pt-6 text-sm text-muted-foreground">
        AI 機能は Claude API キーが設定されていないため使えません。
        <Link href="/admin/ai" className="ml-1 underline underline-offset-4">
          AI設定
        </Link>
        を確認してください。
      </CardContent>
    </Card>
  );
}
