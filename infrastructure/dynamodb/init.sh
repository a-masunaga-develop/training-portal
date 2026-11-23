#!/bin/bash
# tables/*.json から DynamoDB のテーブルを作成する（既に存在するテーブルはスキップ）。
#
#   ./init.sh               DynamoDB Local に作成
#   ./init.sh --aws         AWS の DynamoDB に作成（実行前に確認あり。--yes で省略）
#   ./init.sh --seed        作成後に seed.sh も実行（--aws と併用可）
set -euo pipefail

cd "$(dirname "$0")"
source ./_env.sh "$@"

RUN_SEED="false"
for arg in "${EXTRA_ARGS[@]}"; do
  [ "${arg}" = "--seed" ] && RUN_SEED="true"
done

echo "====================================="
echo "DynamoDB Initialization Start"
echo "====================================="
confirm_target

for file in tables/*.json; do
  table=$(basename "${file}" .json)

  if ${AWS} describe-table --table-name "${table}" >/dev/null 2>&1; then
    echo "[SKIP]   ${table} already exists"
    continue
  fi

  echo "[CREATE] ${table}"
  ${AWS} create-table --cli-input-json "file://${file}" >/dev/null
  ${AWS} wait table-exists --table-name "${table}"
done

echo ""
echo "Current Tables"
${AWS} list-tables

if [ "${RUN_SEED}" = "true" ]; then
  echo ""
  # 確認は済んでいるので seed.sh 側では省略する
  if [ "${TARGET}" = "aws" ]; then
    ./seed.sh --aws --yes
  else
    ./seed.sh
  fi
fi

echo ""
echo "====================================="
echo "Initialization Complete"
echo "====================================="
