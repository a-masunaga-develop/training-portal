/** ブラウザから API を呼び出す（エラー時はメッセージを返す） */
export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return { ok: true, data: undefined as T };
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? `エラーが発生しました（${res.status}）` };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "通信に失敗しました" };
  }
}
