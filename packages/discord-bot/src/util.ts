import { models, type TopicAttributes } from '@hicommonwealth/model';
import { QueryTypes } from 'sequelize';

/**
 * Searches the Commonwealth database Topics table for any topics that are linked to the given Discord Forum
 */
export async function getForumLinkedTopic(
  forumId: string,
): Promise<TopicAttributes> {
  const result = await models.sequelize.query<TopicAttributes>(
    `
    SELECT * FROM "Topics" WHERE channel_id = :forumId AND deleted_at IS NULL LIMIT 1;
  `,
    { type: QueryTypes.SELECT, raw: true, replacements: { forumId } },
  );

  if (result.length > 0) {
    return result[0];
  }
}
