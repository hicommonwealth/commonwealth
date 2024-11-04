import { R2BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage, dispose, logger } from '@hicommonwealth/core';
import { R2_ADAPTER_KEY, models, uploadIfLarge } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';
import { config } from '../server/config';

const log = logger(import.meta);
const BATCH_SIZE = 10;
const queryCase = 'WHEN id = ? THEN ? ';

async function migrateComments(lastId = 0) {
  let lastVersionHistoryId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const commentVersions = await models.sequelize.query<{
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
            lastId: lastVersionHistoryId,
            batchSize: BATCH_SIZE,
          },
          type: QueryTypes.SELECT,
        },
      );

      if (commentVersions.length === 0) {
        await transaction.rollback();
        break;
      }

      lastVersionHistoryId = commentVersions.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const commentVersionIds: number[] = [];
      for (const { id, body } of commentVersions) {
        const { contentUrl } = await uploadIfLarge('comments', body);
        if (!contentUrl) continue;
        queryCases += queryCase;
        replacements.push(id!, contentUrl);
        commentVersionIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "CommentVersionHistories"
              SET content_url = CASE
                  ${queryCases}
                  END
              WHERE id IN (?);
          `,
          {
            replacements: [...replacements, commentVersionIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully uploaded comment version histories ' +
          `${commentVersions[0].id} to ${commentVersions.at(-1)!.id!}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
    break;
  }
}

async function migrateThreads(lastId: number = 0) {
  let lastVersionHistoryId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const threadVersions = await models.sequelize.query<{
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
            lastId: lastVersionHistoryId,
            batchSize: BATCH_SIZE,
          },
          type: QueryTypes.SELECT,
        },
      );

      if (threadVersions.length === 0) {
        await transaction.rollback();
        break;
      }

      lastVersionHistoryId = threadVersions.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const threadVersionIds: number[] = [];
      for (const { id, body } of threadVersions) {
        const { contentUrl } = await uploadIfLarge('threads', body);
        if (!contentUrl) continue;
        queryCases += queryCase;
        replacements.push(id!, contentUrl);
        threadVersionIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
              UPDATE "ThreadVersionHistories"
              SET content_url = CASE
                  ${queryCases}
                  END
              WHERE id IN (?);
          `,
          {
            replacements: [...replacements, threadVersionIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        'Successfully uploaded thread version histories ' +
          `${threadVersions[0].id} to ${threadVersions.at(-1)!.id!}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function main() {
  if (config.NODE_ENV === 'production') {
    blobStorage({
      key: R2_ADAPTER_KEY,
      adapter: R2BlobStorage(),
      isDefault: false,
    });
  }

  const acceptedArgs = ['threads', 'comments'];

  if (!acceptedArgs.includes(process.argv[2])) {
    log.error(`Must provide one of: ${JSON.stringify(acceptedArgs)}`);
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
