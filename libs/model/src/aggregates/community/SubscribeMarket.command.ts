import { Command, InvalidActor, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { config } from '../../config';
import { models } from '../../database';
import { authVerified } from '../../middleware';

export function SubscribeMarket(): Command<typeof schemas.SubscribeMarket> {
  return {
    ...schemas.SubscribeMarket,
    auth: [authVerified()],
    secure: true,
    body: async ({ payload, actor }) => {
      if (!config.MARKETS.ENABLED) {
        throw new InvalidState('Markets feature is not enabled');
      }

      const {
        community_id,
        provider,
        slug,
        question,
        category,
        start_time,
        end_time,
        status,
        image_url,
      } = payload;

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
            'Must be a community admin to subscribe markets',
          );
        }
      } else {
        // If no community_id (global subscription), require super admin
        if (!actor.user.isAdmin) {
          throw new InvalidActor(
            actor,
            'Must be a super admin to subscribe markets globally',
          );
        }
      }

      // If community_id is not provided, it's a global subscription (site admin only)
      const isGlobalSubscription = !community_id;

      await models.sequelize.transaction(async (transaction) => {
        const [market, created] = await models.Market.findOrCreate({
          defaults: {
            provider,
            slug,
            question,
            category,
            start_time,
            end_time,
            status,
            image_url: image_url ?? null,
            is_globally_featured: isGlobalSubscription,
            created_at: new Date(),
            updated_at: new Date(),
          },
          where: { slug },
          transaction,
        });

        // Update image_url if market already existed and we have a new image
        if (!created && image_url && market.image_url !== image_url) {
          await market.update({ image_url }, { transaction });
        }

        // For global subscriptions, update is_globally_featured flag
        if (isGlobalSubscription) {
          await market.update({ is_globally_featured: true }, { transaction });
        } else {
          // For regular community subscriptions, create CommunityMarket entry
          await models.CommunityMarket.create(
            {
              community_id: community_id!,
              market_id: market.id!,
              subscribed_at: new Date(),
            },
            { transaction },
          );
        }
      });

      return true;
    },
  };
}
