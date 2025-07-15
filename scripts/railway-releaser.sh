#!/bin/bash

set -e

# Apply migration to DB
echo "Migrating DB..."
echo ""
npx -y sequelize-cli db:migrate --config packages/commonwealth/server/sequelize.json
echo ""

# Purge the Cloudflare Cache
echo "Purging Cloudflare Cache..."
echo ""
npx -y tsx packages/commonwealth/server/scripts/purgeCloudflareCache.ts