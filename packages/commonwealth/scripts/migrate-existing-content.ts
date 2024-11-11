import { R2BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, dispose, logger } from '@hicommonwealth/core';
import { R2_ADAPTER_KEY, models, uploadIfLarge } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);
const BATCH_SIZE = 10;
const queryCase = 'WHEN id = ? THEN ? ';

async function migrateComments(lastId = 0) {
  let lastCommentId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const comments = await models.sequelize.query<{
        id: number;
        body: string;
      }>(
        `
          SELECT id, body
          FROM "Comments"
          WHERE id > :lastId
            AND LENGTH(body) > 2000 AND content_url IS NULL
          ORDER BY id
          LIMIT :batchSize FOR UPDATE;
      `,
        {
          transaction,
          replacements: {
            lastId: lastCommentId,
            batchSize: BATCH_SIZE,
          },
          type: QueryTypes.SELECT,
        },
      );

      if (comments.length === 0) {
        await transaction.rollback();
        break;
      }

      lastCommentId = comments.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const commentIds: number[] = [];
      for (const { id, body } of comments) {
        const { contentUrl } = await uploadIfLarge('comments', body);
        if (!contentUrl) continue;
        queryCases += queryCase;
        replacements.push(id!, contentUrl);
        commentIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "Comments"
              SET content_url = CASE
                  ${queryCases}
                  END
              WHERE id IN (?);
          `,
          {
            replacements: [...replacements, commentIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully uploaded comments ' +
          `${comments[0].id} to ${comments.at(-1)!.id!}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function migrateThreads(lastId: number = 0) {
  let lastThreadId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const threads = await models.sequelize.query<{
        id: number;
        body: string;
      }>(
        `
          SELECT id, body
          FROM "Threads"
          WHERE id > :lastId
            AND LENGTH(body) > 2000 AND content_url IS NULL
          ORDER BY id
          LIMIT :batchSize FOR UPDATE;
      `,
        {
          transaction,
          replacements: {
            lastId: lastThreadId,
            batchSize: BATCH_SIZE,
          },
          type: QueryTypes.SELECT,
        },
      );

      if (threads.length === 0) {
        await transaction.rollback();
        break;
      }

      lastThreadId = threads.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const threadIds: number[] = [];
      for (const { id, body } of threads) {
        const { contentUrl } = await uploadIfLarge('threads', body);
        if (!contentUrl) continue;
        queryCases += queryCase;
        replacements.push(id!, contentUrl);
        threadIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "Threads"
              SET content_url = CASE
                  ${queryCases}
                  END
              WHERE id IN (?);
          `,
          {
            replacements: [...replacements, threadIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully uploaded threads ' +
          `${threads[0].id} to ${threads.at(-1)!.id!}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function main() {
  blobStorage({
    key: R2_ADAPTER_KEY,
    adapter: R2BlobStorage(),
    isDefault: false,
  });

  const acceptedArgs = ['threads', 'comments'];

  if (!acceptedArgs.includes(process.argv[2])) {
    log.error(`Must provide one of: ${JSON.stringify(acceptedArgs)}`);
    return;
  }

  let lastId = 0;
  if (process.argv[3]) {
    lastId = parseInt(process.argv[3]);
  }

  switch (process.argv[2]) {
    case 'threads':
      await migrateThreads(lastId);
      break;
    case 'comments':
      await migrateComments(lastId);
      break;
    default:
      log.error('Invalid argument!');
  }
}

if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
