import { dispose } from '@hicommonwealth/core';
import { CommentInstance, models, ThreadInstance } from '@hicommonwealth/model';
import { uploadContent } from '@hicommonwealth/shared';
import { Transaction } from 'sequelize';

async function migrateTable(modelName: 'Thread' | 'Comment') {
  let contentColumnName: 'body' | 'text';

  if (modelName === 'Thread') {
    contentColumnName = 'body';
  } else {
    contentColumnName = 'text';
  }

  const batchSize = 10;
  let offset = 0;

  let flag = 0;
  while (flag < 2) {
    const numProcessed = await models.sequelize.transaction(
      async (transaction) => {
        const options = {
          where: {
            s3_id: null,
            community_id: 'tim-test',
          },
          limit: batchSize,
          offset: offset,
          lock: Transaction.LOCK.UPDATE,
          transaction,
        };

        let records: ThreadInstance[] | CommentInstance[];
        if (modelName === 'Thread') {
          records = await models.Thread.findAll(options);
        } else {
          records = await models.Comment.findAll(options);
        }

        if (records.length === 0) {
          return 0;
        }

        const uploadPromises = records
          .filter((t) => !!t[contentColumnName])
          .map(async (record) => {
            try {
              const content = record[contentColumnName];
              const s3Id = await uploadContent(content);
              await (record as any).update({ s3_id: s3Id }, { transaction });
              console.log(`Uploaded ${modelName} id: ${record.id}`);
            } catch (error) {
              console.error(
                `Failed to upload ${modelName} id: ${record.id}`,
                error,
              );
              throw error;
            }
          });

        await Promise.all(uploadPromises);
        offset += batchSize;
        return uploadPromises.length;
      },
    );

    if (numProcessed === 0) {
      break;
    }
  }
}

async function migrate(): Promise<void> {
  await migrateTable('Thread');
  await migrateTable('Comment');
}

if (import.meta.url.endsWith(process.argv[1])) {
  migrate()
    .then(() => {
      console.log('Successfully migrated...');
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('EXIT', true);
    })
    .catch((err) => {
      console.log('Failed to emit a notification:', err);
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispose()('ERROR', true);
    });
}
