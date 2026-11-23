#!/bin/bash
# Load seed/*.json into DynamoDB Local (batch-write-item format, max 25 items per file).
set -euo pipefail

cd "$(dirname "$0")"

ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
REGION="${AWS_REGION:-ap-northeast-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_CLI_FILE_ENCODING=UTF-8
export AWS_PAGER=""

AWS="aws dynamodb --endpoint-url ${ENDPOINT} --region ${REGION}"

for file in seed/*.json; do
  table=$(basename "${file}" .json)
  echo "[SEED] ${table}"
  ${AWS} batch-write-item --request-items "file://${file}" >/dev/null
done

echo "Seeding complete"
