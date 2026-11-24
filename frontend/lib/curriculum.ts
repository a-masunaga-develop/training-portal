import "server-only";
import type { SessionUser } from "./auth";
import { buildCurriculum, type Curriculum, type CurriculumItem } from "./learning";
import { getContent, getPhase, listContents, listPhases, listUserProgress } from "./repository";
import type { Content, Phase } from "./types";

export async function getCurriculum(userId: string): Promise<Curriculum> {
  const [phases, contents, progress] = await Promise.all([
    listPhases(),
    listContents(),
    listUserProgress(userId),
  ]);
  return buildCurriculum(phases, contents, progress);
}

export type ContentAccess =
  | { ok: true; content: Content; phase: Phase; item?: CurriculumItem; curriculum: Curriculum }
  | { ok: false; reason: "not_found" | "locked"; content?: Content; previous?: CurriculumItem };

/**
 * コンテンツを受講できるか判定する
 * - 受講者：公開中かつ解放済み（前のコンテンツを完了済み）のみ
 * - 管理者：非公開・未解放も閲覧可（プレビュー）
 */
export async function checkContentAccess(user: SessionUser, contentId: string): Promise<ContentAccess> {
  const content = await getContent(contentId);
  if (!content) return { ok: false, reason: "not_found" };
  const [phase, curriculum] = await Promise.all([getPhase(content.phaseId), getCurriculum(user.userId)]);
  if (!phase) return { ok: false, reason: "not_found" };

  const item = curriculum.items.find((i) => i.content.contentId === contentId);
  if (user.isAdmin) return { ok: true, content, phase, item, curriculum };

  // 非公開（コンテンツまたはフェーズ）は受講者には存在しないものとして扱う
  if (!item) return { ok: false, reason: "not_found" };
  if (!item.unlocked) {
    const previous = curriculum.items[item.position - 2];
    return { ok: false, reason: "locked", content, previous };
  }
  return { ok: true, content, phase, item, curriculum };
}
