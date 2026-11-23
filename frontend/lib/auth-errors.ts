/** Cognito のエラーを画面表示用の日本語メッセージに変換する */
export function authErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  switch (name) {
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "メールアドレスまたはパスワードが正しくありません";
    case "InvalidPasswordException":
      return "パスワードは8文字以上で、英大文字・英小文字・数字をそれぞれ含めてください";
    case "LimitExceededException":
    case "TooManyRequestsException":
      return "試行回数が多すぎます。しばらく待ってから再度お試しください";
    case "PasswordResetRequiredException":
      return "パスワードのリセットが必要です。管理者に連絡してください";
    case "EmptySignInUsername":
    case "EmptySignInPassword":
      return "メールアドレスとパスワードを入力してください";
    default:
      return error instanceof Error && error.message ? error.message : "エラーが発生しました";
  }
}

/** ログイン後の遷移先として安全なパスか（外部サイトへのリダイレクトを防ぐ） */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/login")) return "/";
  return next;
}
