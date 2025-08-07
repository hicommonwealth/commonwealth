#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables (optionally use dotenv if needed)
const DB_NAME = process.env.PGDATABASE || 'commonwealth';
const DB_USER = process.env.PGUSER || 'commonwealth';
const DB_HOST = process.env.PGHOST || 'localhost';
const DB_PORT = process.env.PGPORT || '5432';
const DB_PASSWORD = process.env.PGPASSWORD || 'edgeware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const assetsDir = join(__dirname, '../assets');
const outputFile = join(assetsDir, 'minimal_schema.sql');

if (!existsSync(assetsDir)) {
  mkdirSync(assetsDir);
}

const env = {
  ...process.env,
  PGPASSWORD: DB_PASSWORD,
};

// Only dump tables from the public schema and exclude specific tables/patterns
const schemaOnly = '--schema=public';
const excludeMeta =
  '--exclude-table=SequelizeMeta --exclude-table-data=SequelizeMeta';
const excludeTmp = '--exclude-table=tmp* --exclude-table-data=tmp*';
const excludeOutbox =
  '--exclude-table=outbox_relayed* --exclude-table-data=outbox_relayed*';
const excludeLockMonitor =
  '--exclude-table=lock_monitor --exclude-table-data=lock_monitor';

const dumpCmd = `pg_dump --schema-only --no-owner --no-privileges ${schemaOnly} ${excludeMeta} ${excludeTmp} ${excludeOutbox} ${excludeLockMonitor} -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${outputFile}"`;

try {
  execSync(dumpCmd, { stdio: 'inherit', env });
  console.log(`\n✅ Minimal schema dump created at: ${outputFile}`);
} catch (err) {
  console.error('❌ Failed to create minimal schema dump:', err);
  throw err;
}
