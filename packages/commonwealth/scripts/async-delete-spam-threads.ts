import { QueryTypes } from 'sequelize';

import { models } from '@hicommonwealth/model/db';
import { ThreadAttributes } from '@hicommonwealth/model/models';
import { parseArgs } from 'node:util';
import { z } from 'zod';

const argSchema = z.object({
  communityId: z.string().min(1),
  deleteAfter: z.string().optional(),
  deleteFromTopicId: z.coerce.number().optional(),
});

const args = parseArgs({
  options: {
    communityId: { type: 'string' },
    deleteAfter: { type: 'string' },
    deleteFromTopicId: { type: 'string' },
  },
  strict: true,
});

const parsedArgs = argSchema.parse(args.values);

async function asyncDeleteThreads() {
  let deletedCount;
  const { communityId, deleteAfter, deleteFromTopicId } = parsedArgs;
  const whereClausesAND: string[] = [];
  const foreignLanguageClause = `(t.title ~ '[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẸỆỈỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỳỵỷỹÝ]' 
        OR t.body ~ '[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẸỆỈỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỳỵỷỹÝ]')`;

  const replacements = { communityId };

  if (deleteAfter) {
    whereClausesAND.push(`t.created_at > :deleteAfter`);
    replacements['deleteAfter'] = deleteAfter;
  }

  if (deleteFromTopicId) {
    whereClausesAND.push(`topic.id = :deleteFromTopicId`);
    replacements['deleteFromTopicId'] = deleteFromTopicId;
  }

  const threadSelectCommand = `
      SELECT DISTINCT t.id
      FROM "Threads" t
               JOIN "Topics" topic ON topic.community_id = t.community_id
      WHERE (t.community_id = :communityId AND ${whereClausesAND.join(' AND ')})
          OR (t.community_id = :communityId AND ${foreignLanguageClause})
          LIMIT 10;
  `;
  console.log('running thread deletion command', threadSelectCommand);

  do {
    const deletedThreadIds = await models.sequelize.transaction(
      async (transaction) => {
        const threads = await models.sequelize.query<ThreadAttributes>(
          threadSelectCommand,
          { type: QueryTypes.SELECT, replacements, transaction },
        );

        if (threads.length === 0) {
          console.log('No more threads found, returning');
          return;
        }

        const threadIds = threads.map((t) => t.id);

        await models.sequelize.query(
          `DELETE
           FROM "Reactions"
           WHERE thread_id IN (:threadIds)
              OR comment_id IN (SELECT id FROM "Comments" WHERE thread_id IN (:threadIds));`,
          { replacements: { threadIds }, transaction },
        );

        await models.sequelize.query(
          `DELETE
           FROM "CommentVersionHistories"
           WHERE comment_id IN
                 (SELECT id FROM "Comments" WHERE thread_id IN (:threadIds));`,
          { replacements: { threadIds }, transaction },
        );

        await models.sequelize.query(
          `DELETE
           FROM "Comments"
           WHERE thread_id IN (:threadIds);`,
          { replacements: { threadIds }, transaction },
        );

        await models.sequelize.query(
          `DELETE
           FROM "ThreadVersionHistories"
           WHERE thread_id IN (:threadIds);`,
          { replacements: { threadIds }, transaction },
        );

        await models.sequelize.query(
          `DELETE
           FROM "Collaborations"
           WHERE thread_id IN (:threadIds);`,
          { replacements: { threadIds }, transaction },
        );

        await models.sequelize.query(
          `DELETE
           FROM "Threads"
           WHERE id IN (:threadIds);`,
          { replacements: { threadIds }, transaction },
        );

        return threadIds;
      },
    );

    deletedCount = deletedThreadIds?.length || 0;
    console.log(`Deleted threads with ids: ${deletedThreadIds}`);
  } while (deletedCount === 10);

  console.log('Thread deletion process completed.');
}

asyncDeleteThreads().catch(console.error);
