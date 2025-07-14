#!/bin/bash

set -e

# Check environment variable configuration
npm install -g sequelize-cli tsx

# Apply migration to DB
echo "Migrating DB..."
echo ""
npx sequelize-cli db:migrate --config packages/commonwealth/server/sequelize.json
echo ""

# Purge the Cloudflare Cache
echo "Purging Cloudflare Cache..."
echo ""
tsx packages/commonwealth/server/scripts/purgeCloudflareCache.ts