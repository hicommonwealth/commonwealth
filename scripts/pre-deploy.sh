#!/bin/bash

set -e

# Check environment variable configuration
echo "Checking environment variables..."
echo ""
node --import=extensionless/register --enable-source-maps ./build/server/scripts/releasePhaseEnvCheck.js
echo ""

# Apply migration to DB
echo "Migrating DB..."
echo ""
npx sequelize-cli db:migrate --config build/server/sequelize.json
echo ""

# Purge the Cloudflare Cache
echo "Purging Cloudflare Cache..."
echo ""
node --import=extensionless/register --enable-source-maps build/server/scripts/purgeCloudflareCache.js