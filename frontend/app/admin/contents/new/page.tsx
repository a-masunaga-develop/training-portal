import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentForm } from "@/components/admin/content-form";
import { listContents, listPhases } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function NewContentPage({ searchParams }: { searchParams: Promise<{ phaseId?: string }> }) {
  const [{ phaseId }, phases, contents] = await Promise.all([searchParams, listPhases(), listContents()]);
  const defaultPhaseId = phases.some((p) => p.phaseId === phaseId) ? phaseId : phases[0]?.phaseId;
  const orders = Object.fromEntries(
    phases.map((p) => {
      const list = contents.filter((c) => c.phaseId === p.phaseId);
      return [p.phaseId, list.length === 0 ? 1 : Math.max(...list.map((c) => c.order)) + 1];
    }),
  );

  return (
    <div className="space-y-4">
      <Link href="/admin/contents" className="text-sm text-muted-foreground hover:underline">
        ← コンテンツ一覧
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">コンテンツを追加</CardTitle>
        </CardHeader>
        <CardContent>
          {phases.length === 0 ? (
            <p className="text-sm text-muted-foreground">先に「Phase管理」でフェーズを登録してください。</p>
          ) : (
            <ContentForm phases={phases} defaultPhaseId={defaultPhaseId} nextOrders={orders} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
