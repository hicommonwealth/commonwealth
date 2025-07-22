#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <key-id>"
  exit 1
fi

KEY_ID="$1"

aws kms decrypt --ciphertext-blob fileb://vault-root \
  --region us-east-1 \
  --encryption-context Service=Vault \
  --key-id "$KEY_ID" \
  --output text \
  --query Plaintext | base64 -d > vault-root.txt

echo "Root key written to vault-root.txt"
