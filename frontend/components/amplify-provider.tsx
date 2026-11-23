"use client";

import { Amplify } from "aws-amplify";
import { amplifyConfig } from "@/lib/amplify-config";

// ssr: true でトークンを Cookie に保存し、サーバー側からもログイン状態を読めるようにする
Amplify.configure(amplifyConfig, { ssr: true });

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
