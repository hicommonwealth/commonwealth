#!/bin/bash

# Throw error if required env vars are not set
: "${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is required}"
: "${ENV_NAME:?ENV_NAME is required}"

# TODO: Refactor in app of apps pattern to bundle with application

kubectl kustomize https://github.com/bank-vaults/vault-operator/deploy/rbac | kubectl apply -f -

kubectl annotate serviceaccount vault \
  -n default \
  eks.amazonaws.com/role-arn=arn:aws:iam::${AWS_ACCOUNT_ID}:role/vault-server-role-${ENV_NAME}
