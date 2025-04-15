import { Command, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { CommunityTierMap } from '@hicommonwealth/shared';
import { models } from '../../database';
import { isSuperAdmin } from '../../middleware';

export function SetCommunityTier(): Command<typeof schemas.SetCommunityTier> {
  return {
    ...schemas.SetCommunityTier,
    auth: [isSuperAdmin],
    body: async ({ payload }) => {
      const { community_id, tier } = payload;
      const community = await models.Community.findByPk(community_id);
      if (!community) throw new InvalidInput('Community not found');

      if (community.tier === tier) {
        return { success: true };
      }

      if (tier === CommunityTierMap.SpamCommunity) {
        const now = new Date();
        await models.sequelize.transaction(async (transaction) => {
          community.tier = CommunityTierMap.SpamCommunity;
          await community.save({ transaction });

          await models.Thread.update(
            {
              marked_as_spam_at: now,
              search: null,
            },
            {
              where: {
                community_id: community_id,
              },
              transaction,
            },
          );

          await models.sequelize.query(
            `
              UPDATE "Comments"
              SET marked_as_spam_at = :now,
                  search = null
              FROM "Threads"
              WHERE "Threads"."id" = "Comments"."thread_id"
              AND "Threads"."community_id" = :community_id
          `,
            {
              replacements: { community_id, now },
              transaction,
            },
          );
        });
      } else {
        community.tier = tier;
        await community.save();
      }

      return { success: true };
    },
  };
}
