import { Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { generateUsername } from 'unique-username-generator';
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
        const { address, tokenId } = payload.parsedArgs;

        // TODO: find community linked to this token, this is just a placeholder
        const community = await models.Community.findOne({
          where: { token_name: tokenId.toString() },
        });
        if (!community) return;

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
                name: generateUsername('', 2),
                avatar_url: null, // TODO: random avatar
              },
            },
            { transaction },
          );

          await models.Address.create(
            {
              community_id: community.id,
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
