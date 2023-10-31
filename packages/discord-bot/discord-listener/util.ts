import { sequelize } from 'discord-bot/utils/database';
import { Message } from 'discord.js';
import { QueryTypes } from 'sequelize';

export function getImageUrls(message: Partial<Message>) {
  if (!message.attachments) return [];
  const attachments = [...message.attachments.values()];

  return attachments
    .filter((attachment) => {
      return attachment.contentType.startsWith('image');
    })
    .map((attachment) => {
      return attachment.url;
    });
}

/**
 * Searches the Commonwealth database Topics table for any topics that are linked to the given Discord Forum
 */
export async function getForumLinkedTopicId(
  forumId: string
): Promise<{ id: number }> {
  const result: { id: number }[] = await sequelize.query(
    `
    SELECT id FROM "Topics" WHERE channel_id = :forumId LIMIT 1;
  `,
    { type: QueryTypes.SELECT, raw: true, replacements: { forumId } }
  );

  if (result.length > 0) {
    return result[0];
  }
}
