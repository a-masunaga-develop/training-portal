export type User = {
  userId: string;
  email?: string;
  name: string;
  role: "student" | "admin";
};

export type Report = {
  reportId: string;
  userId: string;
  date: string;
  hours: number;
  content: string;
  understanding: number;
  comment: string;
  createdAt: string;
};

/* ---------- 学習フェーズ・コンテンツ ---------- */

export type Phase = {
  phaseId: string;
  title: string;
  description: string;
  order: number;
  published: boolean;
};

export const CONTENT_TYPES = ["text", "video", "external", "pdf", "assignment", "exam"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  text: "社内教材",
  video: "動画",
  external: "外部教材",
  pdf: "PDF",
  assignment: "演習課題",
  exam: "試験",
};

export type Content = {
  contentId: string;
  phaseId: string;
  title: string;
  description: string;
  type: ContentType;
  /** 動画・外部教材・PDF の URL */
  url: string;
  /** 社内教材・演習課題の本文（「## 見出し」「- 箇条書き」を解釈する） */
  body: string;
  /** AI テスト生成の元にする字幕・教材テキスト（受講者には表示しない） */
  transcript?: string;
  /** 合格点（0〜100） */
  passScore: number;
  order: number;
  published: boolean;
};

/* ---------- テスト ---------- */

export type Test = {
  testId: string;
  contentId: string;
  question: string;
  choices: string[];
  /** 正解の選択肢 index */
  answer: number;
  explanation: string;
  order: number;
};

/** 受験画面に渡す問題（正解・解説を含めない） */
export type PublicTest = Pick<Test, "testId" | "contentId" | "question" | "choices" | "order">;

export type TestResultDetail = {
  testId: string;
  question: string;
  choices: string[];
  selected: number | null;
  answer: number;
  correct: boolean;
  explanation: string;
};

export type TestResult = {
  resultId: string;
  userId: string;
  contentId: string;
  /** v0.2.0 以前の結果にのみ存在 */
  phase?: string;
  score: number;
  passScore: number;
  passed: boolean;
  /** このコンテンツの何回目の受験か */
  attempts: number;
  correctCount: number;
  total: number;
  details: TestResultDetail[];
  takenAt: string;
};

/* ---------- 進捗 ---------- */

export const PROGRESS_STATUSES = ["not_started", "learning", "testing", "completed"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const PROGRESS_STATUS_LABELS: Record<ProgressStatus, string> = {
  not_started: "未着手",
  learning: "受講中",
  testing: "テスト受験中",
  completed: "完了",
};

export type ContentProgress = {
  userId: string;
  contentId: string;
  status: ProgressStatus;
  /** 最高得点 */
  score?: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
};
