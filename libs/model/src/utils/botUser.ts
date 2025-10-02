import { config } from '../config';
import { models } from '../database';
import type { AddressInstance } from '../models/address';
import type { UserInstance } from '../models/user';

export interface BotUserWithAddress {
  user: UserInstance;
  address: AddressInstance;
}

export const getBotUser = async (): Promise<BotUserWithAddress> => {
  const botUserAddress = config.AI.BOT_USER_ADDRESS;
  if (!botUserAddress) {
    throw new Error('AI_BOT_USER_ADDRESS environment variable is not set');
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

  if (!address || !address.User) {
    throw new Error(
      `Bot user with address ${botUserAddress} not found in database`,
    );
  }

  return {
    user: address.User! as UserInstance,
    address,
  };
};

/**
 * Check if a given address_id belongs to the AI bot user
 */
export const isBotAddress = async (address_id: number): Promise<boolean> => {
  try {
    const { user: botUser } = await getBotUser();
    const address = await models.Address.findByPk(address_id);
    return address?.user_id === botUser.id;
  } catch (error) {
    // If bot user is not configured or not found, return false
    return false;
  }
};
