import { v4 as uuidv4 } from 'uuid';
import { config, models } from '..';

/**
 * Generates an unsubscribe link for a user and updates the database.
 * @param userId - The user's ID
 * @returns {Promise<string>} - The unsubscribe link
 */
export async function generateUnsubscribeLink(userId: string): Promise<string> {
  const unsubscribeUuid = uuidv4();
  await models.User.update(
    { unsubscribe_uuid: unsubscribeUuid },
    { where: { id: userId } },
  );
  const unsubscribeLink = `${config.SERVER_URL}/unsubscribe/${unsubscribeUuid}`;
  return unsubscribeLink;
}
