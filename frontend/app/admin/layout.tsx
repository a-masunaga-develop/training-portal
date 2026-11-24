import { Forbidden } from "@/components/forbidden";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireSessionUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Middleware でも制御しているが、念のため画面側でも管理者か確認する
  const me = await requireSessionUser();
  if (!me.isAdmin) return <Forbidden />;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">管理画面</h1>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
