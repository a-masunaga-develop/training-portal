#!/bin/bash
# init.sh / seed.sh 共通の接続設定。直接実行せず source して使う。
#
#   （オプションなし） DynamoDB Local（http://localhost:8000）に接続
#   --aws              AWS の DynamoDB に接続（AWS CLI に設定済みの認証情報を使用）
#   --yes              --aws 時の確認を省略
#
# 環境変数
#   AWS_REGION         リージョン（既定: ap-northeast-1）
#   AWS_PROFILE        --aws 時に使う AWS CLI のプロファイル
#   DYNAMODB_ENDPOINT  ローカル時の接続先（既定: http://localhost:8000）

TARGET="local"
ASSUME_YES="false"
EXTRA_ARGS=()
for arg in "$@"; do
  case "${arg}" in
    --aws) TARGET="aws" ;;
    --yes | -y) ASSUME_YES="true" ;;
    *) EXTRA_ARGS+=("${arg}") ;;
  esac
done

REGION="${AWS_REGION:-ap-northeast-1}"

# 日本語を含む JSON を Windows でも UTF-8 として読み込む
export AWS_CLI_FILE_ENCODING=UTF-8
export AWS_PAGER=""

if [ "${TARGET}" = "local" ]; then
  ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
  export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
  export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
  AWS="aws dynamodb --endpoint-url ${ENDPOINT} --region ${REGION}"
  TARGET_LABEL="DynamoDB Local (${ENDPOINT})"
else
  AWS="aws dynamodb --region ${REGION}"

  ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || {
    echo "[ERROR] AWS の認証情報を取得できません。aws configure または AWS_PROFILE を確認してください" >&2
    exit 1
  }
  TARGET_LABEL="AWS DynamoDB (account: ${ACCOUNT}, region: ${REGION}${AWS_PROFILE:+, profile: ${AWS_PROFILE}})"
fi

# --aws 時は実行前に投入先を確認する
confirm_target() {
  echo "接続先: ${TARGET_LABEL}"
  if [ "${TARGET}" = "aws" ] && [ "${ASSUME_YES}" != "true" ]; then
    read -r -p "この AWS アカウントに対して実行します。よろしいですか？ [y/N] " answer
    case "${answer}" in
      y | Y | yes | YES) ;;
      *) echo "中止しました"; exit 1 ;;
    esac
  fi
}
