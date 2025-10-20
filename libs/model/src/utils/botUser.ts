import { config } from '../config';
import { models } from '../database';
import type { AddressInstance } from '../models/address';
import type { UserInstance } from '../models/user';

const log = logger(import.meta);

export interface BotUserWithAddress {
  user: UserInstance;
  address: AddressInstance;
}

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
