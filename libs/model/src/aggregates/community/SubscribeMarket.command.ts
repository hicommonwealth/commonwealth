import { Command, InvalidState } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function SubscribeMarket(): Command<typeof schemas.SubscribeMarket> {
  return {
    ...schemas.SubscribeMarket,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
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

        await models.CommunityMarket.create(
          {
            community_id,
            market_id: market.id!,
            subscribed_at: new Date(),
          },
          { transaction },
        );
      });

      return true;
    },
  };
}
