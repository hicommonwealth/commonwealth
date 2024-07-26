//TODO: This should be deleted after comment version histories are fixed
import { dispose } from '@hicommonwealth/core';
import { CommentVersionHistoryInstance, models } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

async function run() {
  const commentCount = (
    await models.sequelize.query(
      `SELECT COUNT(*) FROM "Comments" WHERE version_history_updated = false`,
      {
        raw: true,
        type: QueryTypes.SELECT,
      },
    )
  )[0];

  const count = parseInt(commentCount['count']);
  let i = 0;
  while (i < count) {
    try {
      await models.sequelize.transaction(async (transaction) => {
        const commentVersionHistory: {
          id: number;
          versionHistories: { timestamp: string; body: string }[];
        }[] = (
          await models.sequelize.query(
            `SELECT id, version_history FROM "Comments" where version_history_updated = false
             FOR UPDATE SKIP LOCKED LIMIT 1`,
            {
              raw: true,
              type: QueryTypes.SELECT,
              transaction,
            },
          )
        ).map((c) => ({
          id: parseInt(c['id']),
          versionHistories: c['version_history'].map((v) => JSON.parse(v)),
        }));

        if (commentVersionHistory.length === 0) {
          return;
        }

        for (const versionHistory of commentVersionHistory) {
          console.log(
            `${i}/${count} Updating comment version_histories for id ${versionHistory.id}`,
          );

          const formattedValues = versionHistory.versionHistories.map((v) => {
            const { body, ...rest } = v;
            return {
              comment_id: versionHistory.id,
              ...rest,
              text: body,
            };
          }) as unknown as CommentVersionHistoryInstance[];

          await models.sequelize.query(
            `UPDATE "Comments" SET version_history_updated = true WHERE id = $id`,
            {
              bind: { id: versionHistory.id },
              transaction,
            },
          );
          return await models.CommentVersionHistory.bulkCreate(
            formattedValues,
            {
              transaction,
            },
          );
        }
      });
    } catch (error) {
      console.error('Error:', error.message);
      throw error;
    }

    i += 1;
  }

  console.log('Finished migration');
}

run()
  .then(() => {
    void dispose()('EXIT', true);
  })
  .catch((error) => {
    console.error('Failed to migrate community counts:', error);
  });
