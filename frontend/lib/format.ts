/** 日本時間の今日の日付（YYYY-MM-DD） */
export function todayJst(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

export const UNDERSTANDING_LABELS: Record<number, string> = {
  1: "1：わからない",
  2: "2：少しわかる",
  3: "3：だいたいわかる",
  4: "4：よくわかる",
  5: "5：人に説明できる",
};
