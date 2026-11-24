import { NextResponse, type NextRequest } from "next/server";
import { authorize, badRequest, errorResponse, readJson } from "@/lib/api";
import { getContent, listTestsByContent, saveTest } from "@/lib/repository";
import { parseTest } from "@/lib/validation";
import type { Test } from "@/lib/types";

/** POST /api/admin/tests/bulk  { contentId, questions: [...] } : 問題をまとめて登録（AI 生成結果の保存用） */
export async function POST(req: NextRequest) {
  const body = await readJson<{ contentId?: unknown; questions?: unknown }>(req);
  const contentId = typeof body?.contentId === "string" ? body.contentId : "";
  const questions = Array.isArray(body?.questions) ? body.questions : [];
  if (!contentId) return badRequest("contentId を指定してください");
  if (questions.length === 0 || questions.length > 20) return badRequest("登録する問題を1〜20問選んでください");

  try {
    const auth = await authorize({ adminOnly: true });
    if (auth.response) return auth.response;
    if (!(await getContent(contentId))) {
      return NextResponse.json({ error: "コンテンツが見つかりません" }, { status: 404 });
    }

    // 既存の問題の後ろに並べる
    const existing = await listTestsByContent(contentId);
    let order = existing.reduce((max, t) => Math.max(max, t.order ?? 0), 0);

    const parsed = questions.map((q, i) => {
      const result = parseTest({ ...(q as Record<string, unknown>), contentId, order: ++order });
      return result.errors ? { errors: result.errors.map((e) => `問${i + 1}：${e}`) } : { value: result.value };
    });
    const errors = parsed.flatMap((p) => p.errors ?? []);
    if (errors.length) return badRequest(errors);

    const saved: Test[] = [];
    for (const p of parsed) saved.push(await saveTest(p.value!));
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
