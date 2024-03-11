import { PinoLogger } from '@hicommonwealth/adapters';
import { logger } from '@hicommonwealth/core';
import { S3 } from 'aws-sdk';
import { execSync } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { QueryTypes } from 'sequelize';
import { createGzip } from 'zlib';

const log = logger(PinoLogger()).getLogger(__filename);
const S3_BUCKET_NAME = 'outbox-event-stream-archive';

/**
 * Executes a bash command synchronously to use `pg_dump` to dump specific tables from a PostgreSQL database.
 * @param table The table to dump
 * @param outputFile The file to dump the tables to.
 */
function dumpTablesSync(table: string, outputFile: string): boolean {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set.');
    return false;
  }

  const cmd = `pg_dump -t ${table} -f ${outputFile} -d ${databaseUrl}`;

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

/**
 * Compresses a file using gzip.
 * @param inputFile The path of the file to compress.
 * @param outputFile The path to save the compressed file.
 */
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

/**
 * Uploads a file to an S3 bucket.
 * @param filePath The local path of the file to upload.
 */
async function uploadToS3(filePath: string): Promise<boolean> {
  try {
    const s3 = new S3();
    const fileStream = createReadStream(filePath);

    const params = {
      Bucket: S3_BUCKET_NAME,
      Key: filePath,
      Body: fileStream,
    };

    const data = await s3.upload(params).promise();
    log.info(`File uploaded successfully at ${data.Location}`);
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
  const tablesInPg: string[] = [];

  const result = await models.sequelize.query<{
    table_name: string;
  }>(
    `
    SELECT child.relname AS table_name
    FROM pg_inherits
    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child ON pg_inherits.inhrelid = child.oid
    WHERE parent.relname = 'outbox_relayed';
  `,
    { type: QueryTypes.SELECT, raw: true },
  );

  const now = new Date();
  for (const { table_name } of result) {
    const match = table_name.match(/p(\d{4})_(\d{2})/);
    if (!match) continue;

    const tableDate = new Date(parseInt(match[1]), parseInt(match[2]));
    const lastMonth = new Date(now.getFullYear(), now.getMonth());

    if (tableDate < lastMonth) {
      tablesInPg.push(table_name);
    }
  }

  const s3 = new S3();
  const archiveExists = await Promise.allSettled(
    tablesInPg.map(async (t) => {
      try {
        await s3
          .headObject({
            Bucket: S3_BUCKET_NAME,
            Key: t,
          })
          .promise();
        return true;
      } catch (e) {
        if (e.statusCode === 404) return false;
        else throw e;
      }
    }),
  );

  const tablesToArchive: string[] = [];
  for (let i = 0; i < tablesInPg.length; i++) {
    if (!archiveExists[i]) tablesToArchive.push(tablesInPg[i]);
  }

  return tablesToArchive;
}

async function main() {
  log.info('Checking outbox child table archive status...');
  const tables = await getTablesToBackup();

  for (const table of tables) {
    const dumpName = `${table}/dump.sql`;
    const compressedName = `${dumpName}.gz`;

    const res = dumpTablesSync(table, dumpName);
    if (!res) continue;

    try {
      await compressFile(dumpName, compressedName);
    } catch (e) {
      log.error(`Failed to compress ${dumpName} to ${compressedName}`);
      continue;
    }

    await uploadToS3(compressedName);
  }

  if (tables.length > 0) {
    log.info('Archive outbox complete', undefined, {
      tables,
    });
  }
}

if (require.main === module) {
  main()
    .then(() => {
      log.info('Success');
      process.exit(0);
    })
    .catch((err) => {
      log.error('Failed to archive outbox child partitions to S3', err);
      process.exit(1);
    });
}
