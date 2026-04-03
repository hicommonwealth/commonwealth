import { Command, InvalidActor, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';
import { authVerified, mustExist } from '../../middleware';

export function UnsubscribeMarket(): Command<typeof schemas.UnsubscribeMarket> {
  return {
    ...schemas.UnsubscribeMarket,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      if (!config.MARKETS.ENABLED) {
        throw new InvalidState('Markets feature is not enabled');
      }

      const { community_id, slug } = payload;

      // If community_id is provided, verify community admin role
      if (community_id) {
        const address = await models.Address.findOne({
          where: {
            user_id: actor.user.id,
            address: actor.address,
            community_id,
            role: { [Op.in]: ['admin'] },
            verified: { [Op.ne]: null },
          },
        });
        if (!address && !actor.user.isAdmin) {
          throw new InvalidActor(
            actor,
            'Must be a community admin to unsubscribe markets',
          );
        }
      } else {
        // If no community_id (global subscription), require super admin
        if (!actor.user.isAdmin) {
          throw new InvalidActor(
            actor,
            'Must be a super admin to unsubscribe markets globally',
          );
        }
      }

      const market = await models.Market.findOne({ where: { slug } });
      mustExist('Market', market);

      // Check if this is a global unsubscription (site admin only)
      // If community_id is not provided, it's a global unsubscription
      const isGlobalUnsubscription = !community_id;

      if (isGlobalUnsubscription) {
        // For global subscriptions, unset is_globally_featured flag
        await market.update({ is_globally_featured: false });
      } else {
        // For regular community subscriptions, remove CommunityMarket entry
        await models.CommunityMarket.destroy({
          where: { community_id: community_id!, market_id: market.id },
        });
      }

      // TODO: remove market if last one?

      return true;
    },
  };
}
