import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Forbidden() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <p className="text-sm text-muted-foreground">403</p>
        <CardTitle>アクセス権限がありません</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">このページは管理者のみ利用できます。</p>
        <Button asChild variant="outline">
          <Link href="/">ダッシュボードへ戻る</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
