import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable, Op } from 'sequelize';
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
      });

      if (!result) {
        return;
      }

      const [adminsAndMods, numVotingThreads, numTotalThreads] = await (<
        Promise<
          [
            Array<{ address: string; role: 'admin' | 'moderator' }>,
            number,
            number,
          ]
        >
      >Promise.all([
        models.Address.findAll({
          where: {
            community_id: payload.id,
            [Op.or]: [{ role: 'admin' }, { role: 'moderator' }],
          },
          attributes: ['address', 'role'],
        }),
        models.Thread.count({
          where: {
            community_id: payload.id,
            stage: 'voting',
          },
        }),
        models.Thread.count({
          where: {
            community_id: payload.id,
            marked_as_spam_at: null,
          },
        }),
      ]));

      return {
        ...result.toJSON(),
        adminsAndMods,
        numVotingThreads,
        numTotalThreads,
        communityBanner: result.banner_text,
      } as CommunityAttributes & {
        numVotingThreads: number;
        numTotalThreads: number;
        adminsAndMods: Array<{
          address: string;
          role: 'admin' | 'moderator';
        }>;
        communityBanner: string | undefined;
      };
    },
  };
}
