import type { ResourcesConfig } from "aws-amplify";

/** Cognito 接続設定（ブラウザ・サーバー共通） */
export const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
      loginWith: { email: true },
    },
  },
};
