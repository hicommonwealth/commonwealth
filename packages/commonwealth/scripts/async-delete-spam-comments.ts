import { models } from '@hicommonwealth/model/db';
import { CommentAttributes } from '@hicommonwealth/model/models';
import { QueryTypes } from 'sequelize';

import { parseArgs } from 'node:util';
import { z } from 'zod';

const argSchema = z.object({
  communityId: z.string().min(1),
});

const args = parseArgs({
  options: {
    communityId: { type: 'string' },
  },
  strict: true,
});

const parsedArgs = argSchema.parse(args.values);

async function asyncDeleteComments() {
  let deletedCount;
  const { communityId } = parsedArgs;
  const foreignLanguageClause = `c.body ~ '[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẸỆỈỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỳỵỷỹÝ]'`;

  const replacements = { communityId };

  const commentSelectCommand = `
      SELECT DISTINCT c.id
      FROM "Comments" c
               JOIN "Threads" t ON c.thread_id = t.id
      WHERE t.community_id = :communityId AND ${foreignLanguageClause} 
      LIMIT 10;
  `;
  console.log('running comment deletion command', commentSelectCommand);

  do {
    const deletedCommentIds = await models.sequelize.transaction(
      async (transaction) => {
        const comments = await models.sequelize.query<CommentAttributes>(
          commentSelectCommand,
          { type: QueryTypes.SELECT, replacements, transaction },
        );

        if (comments.length === 0) {
          console.log('No more comments found, returning');
          return;
        }

        const commentIds = comments.map((t) => t.id);

        await models.sequelize.query(
          `DELETE
           FROM "Reactions"
           WHERE comment_id IN (:commentIds);`,
          { replacements: { commentIds }, transaction },
        );

        await models.sequelize.query(
          `DELETE
           FROM "CommentVersionHistories"
           WHERE comment_id IN (:commentIds);`,
          { replacements: { commentIds }, transaction },
        );

        await models.sequelize.query(
          `DELETE
           FROM "Comments"
           WHERE id IN (:commentIds);`,
          { replacements: { commentIds }, transaction },
        );

        return commentIds;
      },
    );

    deletedCount = deletedCommentIds?.length || 0;
    console.log(`Deleted comments with ids: ${deletedCommentIds}`);
  } while (deletedCount === 10);

  console.log('Comment deletion process completed.');
}

asyncDeleteComments().catch(console.error);
