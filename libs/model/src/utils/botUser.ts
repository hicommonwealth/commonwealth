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

  if (!address) {
    throw new Error(`Bot user with address ${botUserAddress} not found`);
  }

  return {
    user: address.User as UserInstance,
    address,
  };
};

export const isBotAddress = async (addressId: number): Promise<boolean> => {
  const address = await models.Address.findByPk(addressId);
  if (!address) {
    return false;
  }
  const { user: botUser } = await getBotUser();
  return address.user_id === botUser.id;
};
