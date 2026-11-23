import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { amplifyConfig } from "./amplify-config";

/** サーバー（Middleware / Server Component / Route Handler）で Cognito のセッションを扱うためのランナー */
export const { runWithAmplifyServerContext } = createServerRunner({ config: amplifyConfig });
