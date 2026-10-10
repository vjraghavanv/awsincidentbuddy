#!/usr/bin/env bash
#
# AWS Incident Buddy - demo script
# Sends the 3 sample incidents to the /analyze endpoint and prints the results.
#
# Usage:
#   ./demo.sh                                  # defaults to http://localhost:3000 (sam local)
#   ./demo.sh https://abc123.execute-api.us-east-1.amazonaws.com   # deployed API
#
set -euo pipefail

API_BASE="${1:-http://localhost:3000}"
ENDPOINT="${API_BASE%/}/analyze"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SAMPLES=(
  "lambda-s3-access-denied.json"
  "cloudformation-create-failed.json"
  "apigw-403.json"
)

echo "AWS Incident Buddy demo"
echo "Endpoint: $ENDPOINT"
echo "========================================"

for sample in "${SAMPLES[@]}"; do
  echo
  echo ">>> Sending: $sample"
  echo "----------------------------------------"
  curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    --data @"$SCRIPT_DIR/$sample" \
    | (command -v jq >/dev/null 2>&1 && jq . || cat)
  echo
done

echo
echo "Demo complete."
