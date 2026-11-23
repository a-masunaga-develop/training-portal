export type User = {
  userId: string;
  name: string;
  role: "student" | "admin";
};

export type Progress = {
  userId: string;
  phase: string;
  completed: number;
  completedLessons: string[];
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

export type Test = {
  testId: string;
  phase: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
};

/** 受験画面に渡す問題（正解・解説を含めない） */
export type PublicTest = Omit<Test, "answer" | "explanation">;

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
  phase: string;
  score: number;
  correctCount: number;
  total: number;
  details: TestResultDetail[];
  takenAt: string;
};
