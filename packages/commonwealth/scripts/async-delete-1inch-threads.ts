import { models, ThreadAttributes } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

async function asyncDelete1inchThreads(batchSize = 10) {
  let deletedCount;

  do {
    const threads = await models.sequelize.query<ThreadAttributes>(
      `
            SELECT t.id FROM "Threads" t
            JOIN "Topics" topic ON topic.community_id = t.community_id
            WHERE topic.id = 2890
            AND t.community_id = '1inch'
            AND t.created_at > '2025-03-21'
            LIMIT :batchSize;
            `,
      {
        type: QueryTypes.SELECT,
        replacements: { batchSize },
      },
    );

    if (threads.length === 0) break;

    const threadIds = threads.map((t) => t.id);

    await models.sequelize.transaction(async (transaction) => {
      await models.sequelize.query(
        `DELETE FROM "Reactions"
                WHERE thread_id IN (:threadIds)
                OR comment_id IN (SELECT id FROM "Comments" WHERE thread_id IN (:threadIds));`,
        { replacements: { threadIds }, transaction },
      );

      await models.sequelize.query(
        `DELETE FROM "CommentVersionHistories"
                WHERE comment_id IN (SELECT id FROM "Comments" WHERE thread_id IN (:threadIds));`,
        { replacements: { threadIds }, transaction },
      );

      await models.sequelize.query(
        `DELETE FROM "Comments"
                WHERE thread_id IN (:threadIds);`,
        { replacements: { threadIds }, transaction },
      );

      await models.sequelize.query(
        `DELETE FROM "ThreadVersionHistories"
                WHERE thread_id IN (:threadIds);`,
        { replacements: { threadIds }, transaction },
      );

      await models.sequelize.query(
        `DELETE FROM "Threads"
                WHERE id IN (:threadIds);`,
        { replacements: { threadIds }, transaction },
      );
    });

    deletedCount = threadIds.length;
    console.log(`Deleted threads with ids: ${threadIds}`);
  } while (deletedCount === batchSize);

  console.log('Thread deletion process completed.');
}

asyncDelete1inchThreads().catch(console.error);
