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
    return null;
  }

  // Cache miss - query DB and populate cache
  try {
    const address = await models.Address.findOne({
      where: { address: botUserAddress },
      include: [
        {
          model: models.User,
          required: true,
        },
      ],
    });

    if (!address || !address.User?.id) {
      throw new Error(`Bot user with address ${botUserAddress} not found`);
    }

    // Populate cache
    cachedBotUserId = address.User.id;
    return address.User.id;
  } catch (error) {
    log.error(
      'Failed to get bot user ID',
      error instanceof Error ? error : undefined,
    );
    return null;
  }
};

export const getBotUser = async (): Promise<BotUserWithAddress | null> => {
  const botUserAddress = config.AI.BOT_USER_ADDRESS;
  if (!botUserAddress) {
    log.error('AI_BOT_USER_ADDRESS environment variable is not set');
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
    log.error('Bot user not found');
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
