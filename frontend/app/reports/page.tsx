import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportForm } from "@/components/report-form";
import { ReportList } from "@/components/report-list";
import { CURRENT_USER_ID } from "@/lib/constants";
import { todayJst } from "@/lib/format";
import { listReports } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports(CURRENT_USER_ID);
  const totalHours = reports.reduce((sum, r) => sum + r.hours, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">日報</h1>
        <p className="text-sm text-muted-foreground">その日の学習内容を記録します。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">日報登録</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportForm defaultDate={todayJst()} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">学習履歴</CardTitle>
          <p className="text-sm text-muted-foreground">
            {reports.length} 件 / 合計 {totalHours} 時間
          </p>
        </CardHeader>
        <CardContent>
          <ReportList reports={reports} />
        </CardContent>
      </Card>
    </div>
  );
}
