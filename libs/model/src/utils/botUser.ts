import { config } from '../config';
import { models } from '../database';
import type { UserInstance } from '../models/user';

/**
 * Gets the AI bot user from the database using the AI_BOT_USER_ID environment variable
 * @returns Promise<UserInstance> The bot user instance
 * @throws Error if AI_BOT_USER_ID is not set or bot user is not found
 */
export const getBotUser = async (): Promise<UserInstance> => {
  const botUserId = config.AI.BOT_USER_ID;
  if (!botUserId) {
    throw new Error('AI_BOT_USER_ID environment variable is not set');
  }

  const botUser = await models.User.findByPk(botUserId);
  if (!botUser) {
    throw new Error(`Bot user with ID ${botUserId} not found in database`);
  }

  return botUser;
};
