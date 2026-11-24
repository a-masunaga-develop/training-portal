import { AiNav } from "@/components/admin/ai-nav";

export default function AdminAiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <AiNav />
      {children}
    </div>
  );
}
