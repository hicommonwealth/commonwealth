import { QueryTypes } from 'sequelize';
import { sequelize } from './database';

/**
 * Searches the Commonwealth database Topics table for any topics that are linked to the given Discord Forum
 */
export async function getForumLinkedTopic(forumId: string): Promise<any> {
  const result = await sequelize.query(
    `
    SELECT * FROM "Topics" WHERE channel_id = :forumId AND deleted_at IS NULL LIMIT 1;
  `,
    { type: QueryTypes.SELECT, raw: true, replacements: { forumId } },
  );

  if (result.length > 0) {
    return result[0];
  }
}
