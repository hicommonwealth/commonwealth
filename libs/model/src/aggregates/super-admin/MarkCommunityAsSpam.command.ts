import { Command, InvalidInput } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { CommunityTierMap } from '@hicommonwealth/shared';
import { models } from 'model/src/database';
import { isSuperAdmin } from 'model/src/middleware';

export function MarkCommunityAsSpam(): Command<
  typeof schemas.MarkCommunityAsSpam
> {
  return {
    ...schemas.MarkCommunityAsSpam,
    auth: [isSuperAdmin],
    body: async ({ payload }) => {
      const { community_id } = payload;
      const community = await models.Community.findByPk(community_id);
      if (!community) throw new InvalidInput('Community not found');

      if (community.tier === CommunityTierMap.SpamCommunity) {
        return { success: true };
      }

      const now = new Date();
      await models.sequelize.transaction(async (transaction) => {
        community.tier = CommunityTierMap.SpamCommunity;
        await community.save({ transaction });

        await models.Thread.update(
          {
            marked_as_spam_at: now,
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
            SET "marked_as_spam_at" = :now
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

      return { success: true };
    },
  };
}
