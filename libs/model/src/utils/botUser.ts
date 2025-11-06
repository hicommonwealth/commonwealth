import { logger } from '@hicommonwealth/core';
import { config } from '../config';
import { models } from '../database';
import type { AddressInstance } from '../models/address';
import type { UserInstance } from '../models/user';

const log = logger(import.meta);

// In-memory cache for bot user ID (no TTL since it's essentially static)
let cachedBotUserId: number | null | undefined = undefined;

export interface BotUserWithAddress {
  user: UserInstance;
  address: AddressInstance;
}

/**
 * Clear the bot user ID cache. This is useful for testing purposes
 * when the bot user configuration changes during the test lifecycle.
 */
export const clearBotUserCache = (): void => {
  cachedBotUserId = undefined;
};

/**
 * Get the cached bot user ID. This is more efficient than getBotUser()
 * when you only need to check the user ID.
 */
const getBotUserId = async (): Promise<number | null> => {
  // Return cached value if available
  if (cachedBotUserId !== undefined) {
    return cachedBotUserId;
  }

  const botUserAddress = config.AI.BOT_USER_ADDRESS;
  if (!botUserAddress) {
    // Cache null result to avoid repeated config checks
    cachedBotUserId = null;
    return null;
  }

  // Cache miss - query DB and populate cache
  try {
    const address = await models.Address.findOne({
      where: { address: botUserAddress },
      attributes: ['user_id'],
    });

    if (!address || !address.user_id) {
      // Don't cache - the address might be created later (e.g., in tests)
      // Only return null for this request
      return null;
    }

    // Populate cache
    cachedBotUserId = address.user_id;
    return address.user_id;
  } catch (error) {
    log.error(
      'Failed to get bot user ID',
      error instanceof Error ? error : undefined,
    );
    // Don't cache DB errors either - they might be transient
    return null;
  }
};

export const getBotUser = async (): Promise<BotUserWithAddress | null> => {
  const botUserAddress = config.AI.BOT_USER_ADDRESS;
  if (!botUserAddress) {
    // AI bot feature is not configured - this is expected in many environments
    log.debug('AI_BOT_USER_ADDRESS environment variable is not set');
    return null;
  }

  const address = await models.Address.findOne({
    where: { address: botUserAddress },
    include: [
      {
        model: models.User,
        required: true,
      },
    ],
  });

  if (!address) {
    throw new Error(`Bot user with address ${botUserAddress} not found`);
  }

  return {
    user: address.User as UserInstance,
    address,
  };
};

export const isBotAddress = async (addressId: number): Promise<boolean> => {
  const botUser = await getBotUser();
  if (!botUser) {
    // Bot user not configured - not an error, just return false
    return false;
  }
  const address = await models.Address.findOne({
    where: {
      id: addressId,
      user_id: botUser.user.id,
    },
  });
  return !!address;
};

export const isBotUser = async (userId: number): Promise<boolean> => {
  try {
    const botUserId = await getBotUserId();
    if (!botUserId) {
      return false;
    }
    return botUserId === userId;
  } catch (error) {
    // Bot user not configured or not found in database
    log.error(
      'Error checking if user is bot',
      error instanceof Error ? error : undefined,
    );
    return false;
  }
};
