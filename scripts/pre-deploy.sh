#!/bin/bash

set -e

# Check environment variable configuration
node --import=extensionless/register --enable-source-maps ./build/server/scripts/releasePhaseEnvCheck.js

# Apply migration to DB
npx sequelize-cli db:migrate --config build/server/sequelize.json

# Purge the Cloudflare Cache
node --import=extensionless/register --enable-source-maps build/server/scripts/purgeCloudflareCache.js