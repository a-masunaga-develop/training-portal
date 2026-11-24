import "server-only";
import { buildCurriculum, type Curriculum } from "./learning";
import { listAllProgress, listContents, listPhases, listUsers } from "./repository";
import type { Content, User } from "./types";

export type StudentSummary = { user: User; curriculum: Curriculum };

/** 受講者ごとのカリキュラム（進捗）をまとめて取得する */
export async function getStudentSummaries(): Promise<{ students: StudentSummary[]; contents: Content[] }> {
  const [users, phases, contents, progress] = await Promise.all([
    listUsers(),
    listPhases(),
    listContents(),
    listAllProgress(),
  ]);
  const students = users
    .filter((u) => u.role === "student")
    .map((user) => ({
      user,
      curriculum: buildCurriculum(
        phases,
        contents,
        progress.filter((p) => p.userId === user.userId),
      ),
    }));
  return { students, contents };
}
