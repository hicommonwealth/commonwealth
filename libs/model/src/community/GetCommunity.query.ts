import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable, literal, Op } from 'sequelize';
import { models } from '../database';
import { CommunityAttributes } from '../models';

export function GetCommunity(): Query<typeof schemas.GetCommunity> {
  return {
    ...schemas.GetCommunity,
    auth: [],
    secure: false,
    body: async ({ payload }) => {
      const where = { id: payload.id };
      const include: Includeable[] = [
        {
          model: models.Address,
          attributes: ['address', 'role'],
          where: {
            // @ts-expect-error StrictNullChecks
            community_id: id,
            [Op.or]: [{ role: 'admin' }, { role: 'moderator' }],
          },
          as: 'adminsAndMods',
        },
        {
          model: models.CommunityBanner,
        },
        {
          model: models.CommunityStake,
        },
        {
          model: models.CommunityTags,
          include: [
            {
              model: models.Tags,
            },
          ],
        },
      ];
      if (payload.include_node_info) {
        include.push({
          model: models.ChainNode,
          required: true,
        });
      }

      const result = await models.Community.findOne({
        where,
        include,
        attributes: {
          include: [
            [
              literal(`
                  SELECT COUNT(*) FROM "Threads"
                  WHERE "Threads"."community_id" = "Communities"."id"
                    AND "Threads"."stage" = 'voting')
                `),
              'numVotingThreads',
            ],
            [
              literal(`
                  SELECT COUNT(*) FROM "Threads"
                  WHERE "Threads"."community_id" = "Communities"."id"
                    AND "Threads"."marked_as_spam_at" IS NULL)
                `),
              'numTotalThreads',
            ],
            [
              literal(`
                  SELECT banner_text FROM "CommunityBanners"
                  WHERE "CommunityBanners"."community_id" = "Communities"."id")
                `),
              'communityBanner',
            ],
          ],
        },
      });
      return result?.toJSON() as
        | (CommunityAttributes & {
            numVotingThreads: number;
            numTotalThreads: number;
            adminsAndMods: Array<{
              address: string;
              role: 'admin' | 'moderator';
            }>;
            communityBanner: string | undefined;
          })
        | undefined;
    },
  };
}
