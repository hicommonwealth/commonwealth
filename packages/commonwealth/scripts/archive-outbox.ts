import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { HotShotsStats } from '@hicommonwealth/adapters';
import { logger, stats } from '@hicommonwealth/core';
import { config, formatS3Url } from '@hicommonwealth/model';
import { execSync } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { createGzip } from 'zlib';

// REQUIRED for S3 env var

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);
const S3_BUCKET_NAME = 'outbox-event-stream-archive';

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
    const s3 = new S3();
    const fileStream = createReadStream(filePath);

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: filePath,
      Body: fileStream,
    };

    const data = await new Upload({
      client: s3,
      params,
    }).done();
    log.info(
      `File uploaded successfully at ${formatS3Url(
        data.Location,
        S3_BUCKET_NAME,
      )}`,
    );
    return true;
  } catch (error) {
    log.error(`S3 upload failed`, error, {
      S3_BUCKET_NAME,
      filePath,
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

  const s3 = new S3();
  const archiveExists = await Promise.allSettled(
    tablesInPg.map(async (t) => {
      try {
        const objectKey = getCompressedDumpName(getDumpName(t));
        log.info(
          `Searching for ${objectKey} in S3 bucket ${S3_BUCKET_NAME}...`,
        );
        await s3.headObject({
          Bucket: S3_BUCKET_NAME,
          Key: objectKey,
        });
        return true;
      } catch (e) {
        if (e.statusCode === 404) return false;
        else throw e;
      }
    }),
  );

  log.info('Existing archives retrieved', {
    archiveExists,
  });

  const tablesToArchive: string[] = [];
  for (let i = 0; i < tablesInPg.length; i++) {
    const s3Res = archiveExists[i];
    if (s3Res.status === 'fulfilled' && !s3Res.value) {
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
  main()
    .then(() => {
      log.info('Success');
      stats(HotShotsStats()).increment('cw.scheduler.archive-outbox');
      process.exit(0);
    })
    .catch((err) => {
      log.fatal('Failed to archive outbox child partitions to S3', err);
      process.exit(1);
    });
}
