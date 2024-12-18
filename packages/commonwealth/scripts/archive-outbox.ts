import { HotShotsStats, S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, dispose, logger, stats } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import { execSync } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { QueryTypes } from 'sequelize';
import { createGzip } from 'zlib';

const log = logger(import.meta);
const _blobStorage = blobStorage({
  adapter: S3BlobStorage(),
});

function dumpTablesSync(table: string, outputFile: string): boolean {
  const databaseUrl = config.DB.URI;

  if (!databaseUrl) {
    log.error('DATABASE_URL environment variable is not set.');
    return false;
  }

  const cmd = `PGSSLMODE=allow pg_dump -t ${table} -f ${outputFile} -d ${databaseUrl}`;

  try {
    // execSync returns stdout as Buffer by default, convert it to string if needed
    execSync(cmd).toString();
    return true;
  } catch (error) {
    log.error(`Failed to dump Outbox child partition table`, error, {
      table,
      outputFile,
    });
  }

  return false;
}

function compressFile(inputFile: string, outputFile: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const gzip = createGzip();
    const source = createReadStream(inputFile);
    const destination = createWriteStream(outputFile);

    source
      .pipe(gzip)
      .pipe(destination)
      .on('finish', () => resolve())
      .on('error', (error) => reject(error));
  });
}

async function uploadToS3(filePath: string): Promise<boolean> {
  try {
    const fileStream = createReadStream(filePath);
    const { url } = await _blobStorage.upload({
      key: filePath,
      bucket: 'archives',
      content: fileStream,
    });
    log.info(`File uploaded successfully at ${url}`);
    return true;
  } catch (error) {
    log.error(`S3 upload failed`, error, {
      filePath,
      bucket: 'archives',
    });
  }

  return false;
}

async function getTablesToBackup(): Promise<string[]> {
  const { models } = await import('@hicommonwealth/model');

  const result = await models.sequelize.query<{
    table_name: string;
  }>(
    `
        SELECT tablename as table_name
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename LIKE 'outbox_relayed_p%'
          AND to_date(SUBSTRING(tablename FROM 'p(\\d{8})$'), 'YYYYMMDD') < date_trunc('month', CURRENT_DATE);
    `,
    { type: QueryTypes.SELECT, raw: true },
  );

  if (result.length === 0) {
    log.error(
      'No possible archival tables found! Check the Outbox partition policy (pg_partman).',
    );
    return [];
  }

  const tablesInPg = result.map((t) => t.table_name);
  log.info('Possible tables found', {
    tablesInPg,
  });

  const archiveExists = await Promise.allSettled(
    tablesInPg.map(async (t) => {
      const objectKey = getCompressedDumpName(getDumpName(t));
      log.info(`Searching for ${objectKey} in archives...`);
      return await _blobStorage.exists({
        key: objectKey,
        bucket: 'archives',
      });
    }),
  );

  log.info('Existing archives retrieved', {
    archiveExists,
  });

  const tablesToArchive: string[] = [];
  for (let i = 0; i < tablesInPg.length; i++) {
    const s3Res = archiveExists[i];
    if (
      (s3Res.status === 'fulfilled' && !s3Res.value) ||
      (s3Res.status === 'rejected' && s3Res.reason.name === 'NotFound')
    ) {
      tablesToArchive.push(tablesInPg[i]);
    } else if (s3Res.status === 'rejected') {
      log.error('Error fetching headObject from S3', undefined, {
        reason: s3Res.reason,
        table: tablesInPg[i],
      });
    }
  }

  return tablesToArchive;
}

function getDumpName(tableName: string): string {
  return `${tableName}.dump.sql`;
}

function getCompressedDumpName(dumpName: string): string {
  return `${dumpName}.gz`;
}

async function main() {
  log.info('Checking outbox child table archive status...');
  const tables = await getTablesToBackup();
  log.info(`Found ${tables.length} to archive`, {
    tables,
  });

  for (const table of tables) {
    const dumpName = getDumpName(table);
    const compressedName = getCompressedDumpName(dumpName);

    log.info(`Dumping table`, { table });
    const res = dumpTablesSync(table, dumpName);
    if (!res) continue;
    log.info(`Dump complete`, { dumpName });

    log.info('Compressing dump', { table });
    try {
      await compressFile(dumpName, compressedName);
    } catch (e) {
      log.error(`Failed to compress ${dumpName} to ${compressedName}`);
      continue;
    }
    log.info('Compression complete beginning S3 upload', {
      compressedName,
    });

    await uploadToS3(compressedName);
  }

  if (tables.length > 0) {
    log.info('Archive outbox complete', {
      tables,
    });
  } else {
    log.info('No tables needed to be archived');
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  stats({
    adapter: HotShotsStats(),
  });
  main()
    .then(async () => {
      stats().on('cw.scheduler.archive-outbox');
      await dispose()('EXIT', true);
    })
    .catch(async (err) => {
      stats().off('cw.scheduler.archive-outbox');
      log.fatal('Failed to archive outbox child partitions to S3', err);
      await dispose()('ERROR', true);
    });
}
