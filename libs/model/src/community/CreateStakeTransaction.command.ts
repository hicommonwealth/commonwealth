import type { Command } from '@hicommonwealth/core';
import { schemas } from '@hicommonwealth/core';
import { models } from '../database';
import { authorizeUser } from '../middleware/index';

export const CreateStakeTransaction: Command<
  typeof schemas.commands.CreateStakeTransaction
> = () => ({
  ...schemas.commands.CreateStakeTransaction,
  auth: [],
  secure: true,
  body: async ({ actor, payload }) => {
    await authorizeUser(actor, payload.address, payload.community_id);

    const transaction = await models.StakeTransaction.create(payload);

    return transaction?.get({ plain: true });
  },
});
