#!/bin/bash
# Create DynamoDB Local tables from tables/*.json (idempotent).
set -euo pipefail

cd "$(dirname "$0")"

ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
REGION="${AWS_REGION:-ap-northeast-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_CLI_FILE_ENCODING=UTF-8
export AWS_PAGER=""

AWS="aws dynamodb --endpoint-url ${ENDPOINT} --region ${REGION}"

echo "====================================="
echo "DynamoDB Local Initialization Start"
echo "====================================="

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

if [ "${1:-}" = "--seed" ]; then
  echo ""
  ./seed.sh
fi

echo ""
echo "====================================="
echo "Initialization Complete"
echo "====================================="
