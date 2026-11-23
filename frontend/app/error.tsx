"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>データを読み込めませんでした</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          DynamoDB Local が起動しているか、テーブルが作成されているか確認してください。
        </p>
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
{`docker compose up -d
./infrastructure/dynamodb/init.sh
./infrastructure/dynamodb/seed.sh`}
        </pre>
        {error.message && <p className="text-xs text-muted-foreground">詳細：{error.message}</p>}
        <Button onClick={reset}>再読み込み</Button>
      </CardContent>
    </Card>
  );
}
