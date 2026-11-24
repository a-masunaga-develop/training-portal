import { PhaseManager } from "@/components/admin/phase-manager";
import { listContents, listPhases } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminPhasesPage() {
  const [phases, contents] = await Promise.all([listPhases(), listContents()]);
  const counts = Object.fromEntries(
    phases.map((p) => [p.phaseId, contents.filter((c) => c.phaseId === p.phaseId).length]),
  );
  return <PhaseManager phases={phases} contentCounts={counts} />;
}
