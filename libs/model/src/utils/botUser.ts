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
