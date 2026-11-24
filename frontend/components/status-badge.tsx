import { Badge } from "@/components/ui/badge";
import { PROGRESS_STATUS_LABELS, type ProgressStatus } from "@/lib/types";

const VARIANTS: Record<ProgressStatus, "default" | "secondary" | "outline"> = {
  completed: "default",
  testing: "secondary",
  learning: "secondary",
  not_started: "outline",
};

export function StatusBadge({ status, locked }: { status: ProgressStatus; locked?: boolean }) {
  if (locked) return <Badge variant="outline" className="text-muted-foreground">🔒 未解放</Badge>;
  return <Badge variant={VARIANTS[status]}>{PROGRESS_STATUS_LABELS[status]}</Badge>;
}
