#!/bin/bash

# Exit on any error
set -e

# Load environment variables
. ../../scripts/load-env-var.sh --source-only

load-env-var '../../.env';

# Determine dev branch name based on git user
BRANCH_NAME="dev-$(git config user.name)"

# Create a new branch from the production branch if it doesn't exist
if ! neonctl branches list -o json | jq -e '.[] | select(.name == "'$BRANCH_NAME'")' > /dev/null; then
  echo "Branch '$BRANCH_NAME' does not exist. Creating it from 'production' branch..."
  neonctl branches create --name "$BRANCH_NAME" --parent "production" \
    --suspend-timeout 300 \
    --cu 0.25-1
  echo "Branch '$BRANCH_NAME' has been created successfully."
else
  echo "Branch '$BRANCH_NAME' already exists."
fi

# Fetch and log the new branch database connection string
DB_URL=$(neon connection-string "$BRANCH_NAME" --database-name commonwealth)
echo "NOTE: You must add the following in your .env file:"
echo "DATABASE_URL=$DB_URL"