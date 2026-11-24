import type { Content, ContentProgress, Phase, ProgressStatus } from "./types";

export type CurriculumItem = {
  content: Content;
  phase: Phase;
  status: ProgressStatus;
  score?: number;
  completedAt?: string;
  /** 前のコンテンツをすべて完了していれば true */
  unlocked: boolean;
  /** 全体での順番（1始まり） */
  position: number;
};

export type Curriculum = {
  items: CurriculumItem[];
  completedCount: number;
  total: number;
  /** 進捗率（%） */
  rate: number;
};

/** 公開中のフェーズ順 → コンテンツ順に並べる */
export function orderPublished(phases: Phase[], contents: Content[]): { phase: Phase; content: Content }[] {
  const published = phases.filter((p) => p.published).sort((a, b) => a.order - b.order);
  return published.flatMap((phase) =>
    contents
      .filter((c) => c.published && c.phaseId === phase.phaseId)
      .sort((a, b) => a.order - b.order)
      .map((content) => ({ phase, content })),
  );
}

/**
 * 受講者のカリキュラム（受講順・状態・解放状況）を組み立てる。
 * 前のコンテンツを完了しないと次のコンテンツは解放されない（フェーズをまたいで順番に進む）。
 */
export function buildCurriculum(
  phases: Phase[],
  contents: Content[],
  progress: ContentProgress[],
): Curriculum {
  const byContent = new Map(progress.map((p) => [p.contentId, p]));
  let previousCompleted = true;

  const items = orderPublished(phases, contents).map(({ phase, content }, i) => {
    const p = byContent.get(content.contentId);
    const status: ProgressStatus = p?.status ?? "not_started";
    const item: CurriculumItem = {
      content,
      phase,
      status,
      score: p?.score,
      completedAt: p?.completedAt,
      unlocked: previousCompleted,
      position: i + 1,
    };
    previousCompleted = previousCompleted && status === "completed";
    return item;
  });

  const completedCount = items.filter((i) => i.status === "completed").length;
  return {
    items,
    completedCount,
    total: items.length,
    rate: items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100),
  };
}

/** 次に学習するコンテンツ（解放済みで未完了の最初のもの） */
export function nextItem(curriculum: Curriculum): CurriculumItem | undefined {
  return curriculum.items.find((i) => i.unlocked && i.status !== "completed");
}
