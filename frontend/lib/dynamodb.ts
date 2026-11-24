import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLocal = (process.env.APP_ENV ?? "local") === "local";

// Amplify では AWS_ で始まる環境変数を登録できないため APP_REGION を優先する
const region = process.env.APP_REGION ?? process.env.AWS_REGION ?? "ap-northeast-1";

const config: DynamoDBClientConfig = isLocal
  ? {
      // ローカル：DynamoDB Local にダミーの認証情報で接続
      region,
      endpoint: process.env.DYNAMODB_ENDPOINT ?? "http://localhost:8000",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "test",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "test",
      },
    }
  : {
      // 本番：AWS の DynamoDB。認証情報は Amplify のコンピューティングロール（IAMロール）から自動取得
      region,
    };

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient(config), {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  users: process.env.USERS_TABLE ?? "users",
  reports: process.env.REPORTS_TABLE ?? "reports",
  phases: process.env.PHASES_TABLE ?? "phases",
  contents: process.env.CONTENTS_TABLE ?? "contents",
  tests: process.env.TESTS_TABLE ?? "tests",
  testResults: process.env.TEST_RESULTS_TABLE ?? "test_results",
  contentProgress: process.env.CONTENT_PROGRESS_TABLE ?? "content_progress",
} as const;
