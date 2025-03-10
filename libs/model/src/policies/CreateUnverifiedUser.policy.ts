import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { ZodUndefined } from 'zod';
import { models } from '../database';

const inputs = {
  TokenLocked: events.TokenLocked,
};

/**
 * Creates an unverified common user when a new TokenLocked chain event is received and user doesn't exists
 */
export function CreateUnverifiedUser(): Policy<typeof inputs, ZodUndefined> {
  return {
    inputs,
    body: {
      TokenLocked: async ({ payload }) => {
        const { address } = payload.parsedArgs;

        await models.sequelize.transaction(async (transaction) => {
          // address already linked to a user
          const found = await models.Address.findOne({
            where: { address, user_id: { [Op.ne]: null } },
            attributes: ['community_id', 'user_id'],
            transaction,
          });
          if (found) return;

          const user = await models.User.create(
            {
              email: null,
              profile: {
                name: address.substring(0, 8), // TODO: unclaimed name
                avatar_url: null, // TODO: random avatar
              },
            },
            { transaction },
          );

          await models.Address.create(
            {
              community_id: 'base', // TODO: how to choose a community from payload?
              address,
              user_id: user.id!,
              last_active: new Date(),
              role: 'member',
              is_user_default: false,
              ghost_address: false,
              is_banned: false,
            },
            { transaction },
          );
        });
      },
    },
  };
}
