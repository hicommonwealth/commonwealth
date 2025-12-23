import { Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function SubscribeMarket(): Command<typeof schemas.SubscribeMarket> {
  return {
    ...schemas.SubscribeMarket,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const {
        community_id,
        provider,
        slug,
        question,
        category,
        start_time,
        end_time,
        status,
      } = payload;

      await models.sequelize.transaction(async (transaction) => {
        const [market] = await models.Market.findOrCreate({
          defaults: {
            provider,
            slug,
            question,
            category,
            start_time,
            end_time,
            status,
            created_at: new Date(),
            updated_at: new Date(),
          },
          where: { slug },
          transaction,
        });
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
