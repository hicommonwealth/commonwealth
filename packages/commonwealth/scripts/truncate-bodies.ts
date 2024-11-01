import { dispose, logger } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { safeTruncateBody } from '@hicommonwealth/shared';
import { QueryTypes } from 'sequelize';

const log = logger(import.meta);

const BATCH_SIZE = 10;
const queryCase = 'WHEN id = ? THEN ? ';

async function truncateText(
  {
    tableName,
    columnName,
  }: {
    tableName:
      | 'Threads'
      | 'ThreadVersionHistories'
      | 'Comments'
      | 'CommentVersionHistories';
    columnName: 'body';
  },
  lastId = 0,
) {
  let lastProcessedId = lastId;
  while (true) {
    const transaction = await models.sequelize.transaction();
    try {
      const records = await models.sequelize.query<{
        id: number;
        content: string;
      }>(
        `
          SELECT id, ${columnName} as content
          FROM "${tableName}"
          WHERE id > :lastId
            AND content_url IS NOT NULL
          ORDER BY id
          LIMIT :batchSize FOR UPDATE;
      `,
        {
          transaction,
          replacements: {
            lastId: lastProcessedId,
            batchSize: BATCH_SIZE,
          },
          type: QueryTypes.SELECT,
        },
      );

      if (records.length === 0) {
        await transaction.rollback();
        break;
      }

      lastProcessedId = records.at(-1)!.id!;

      let queryCases = '';
      const replacements: (number | string)[] = [];
      const recordIds: number[] = [];
      for (const { id, content } of records) {
        const truncatedContent = safeTruncateBody(content, 2000);
        if (content === truncatedContent) continue;
        queryCases += queryCase;
        replacements.push(id!, truncatedContent);
        recordIds.push(id!);
      }

      if (replacements.length > 0) {
        await models.sequelize.query(
          `
            UPDATE "${tableName}"
            SET ${columnName} = CASE
                ${queryCases}
                END
            WHERE id IN (?);
        `,
          {
            replacements: [...replacements, recordIds],
            type: QueryTypes.BULKUPDATE,
            transaction,
          },
        );
      }
      await transaction.commit();
      log.info(
        `Successfully truncated ${tableName} ` +
          `${records[0].id} to ${records.at(-1)!.id!}`,
      );
    } catch (e) {
      log.error('Failed to update', e);
      await transaction.rollback();
      break;
    }
  }
}

async function main() {
  const acceptedArgs = [
    'threads',
    'comments',
    'thread-versions',
    'comment-versions',
  ];
  if (!acceptedArgs.includes(process.argv[2])) {
    throw new Error(`Must provide one of: ${JSON.stringify(acceptedArgs)}`);
  }

  let lastId = 0;
  if (process.argv[3]) {
    lastId = parseInt(process.argv[3]);
  }

  switch (process.argv[2]) {
    case 'threads':
      await truncateText({ tableName: 'Threads', columnName: 'body' }, lastId);
      break;
    case 'comments':
      await truncateText({ tableName: 'Comments', columnName: 'body' }, lastId);
      break;
    case 'thread-versions':
      await truncateText(
        { tableName: 'ThreadVersionHistories', columnName: 'body' },
        lastId,
      );
      break;
    case 'comment-versions':
      await truncateText(
        { tableName: 'CommentVersionHistories', columnName: 'body' },
        lastId,
      );
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
