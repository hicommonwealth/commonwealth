//TODO: This should be deleted after comment version histories are fixed
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
      const commentVersionHistory: {
        id: number;
        versionHistories: { timestamp: string; body: string }[];
      }[] = (
        await models.sequelize.query(
          `SELECT id, version_history FROM "Comments" where version_history_updated = false LIMIT 10`,
          {
            raw: true,
            type: QueryTypes.SELECT,
          },
        )
      ).map((c) => ({
        id: parseInt(c['id']),
        versionHistories: c['version_history'].map((v) => JSON.parse(v)),
      }));

      if (commentVersionHistory.length === 0) {
        break;
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

        await models.sequelize.transaction(async (transaction) => {
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
        });
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }

    i += 1;
  }

  console.log('Finished migration');
  process.exit(0);
}

run();
