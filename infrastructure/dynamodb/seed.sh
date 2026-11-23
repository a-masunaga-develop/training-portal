#!/bin/bash
# seed/*.json を DynamoDB に投入する（batch-write-item 形式、1ファイル25件まで）。
#
#   ./seed.sh         DynamoDB Local に投入
#   ./seed.sh --aws   AWS の DynamoDB に投入（実行前に確認あり。--yes で省略）
set -euo pipefail

cd "$(dirname "$0")"
source ./_env.sh "$@"

confirm_target

TMP_FILE=$(mktemp)
trap 'rm -f "${TMP_FILE}"' EXIT

for file in seed/*.json; do
  table=$(basename "${file}" .json)
  echo "[SEED] ${table}"

  request="file://${file}"
  for attempt in 1 2 3 4 5; do
    # 処理されなかった項目（UnprocessedItems）だけを受け取り、残っていれば再送する
    unprocessed=$(${AWS} batch-write-item --request-items "${request}" \
      --query UnprocessedItems --output json)

    if [ -z "${unprocessed}" ] || [ "${unprocessed}" = "{}" ] || [ "${unprocessed}" = "null" ]; then
      break
    fi
    if [ "${attempt}" = 5 ]; then
      echo "[ERROR] ${table}: 一部の項目を投入できませんでした" >&2
      echo "${unprocessed}" >&2
      exit 1
    fi

    echo "  未処理の項目を再送します（${attempt}回目）"
    printf '%s' "${unprocessed}" > "${TMP_FILE}"
    request="file://${TMP_FILE}"
    sleep "${attempt}"
  done
done

echo "Seeding complete"
