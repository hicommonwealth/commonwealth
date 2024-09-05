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
          required: false,
        },
        {
          model: models.CommunityTags,
          required: false,
          include: [
            {
              model: models.Tags,
              required: false,
            },
          ],
        },
      ];

      if (payload.include_node_info) {
        include.push({
          model: models.ChainNode,
          required: false,
        });
      }

      const result = await models.Community.findOne({
        where,
        include,
      });

      if (!result) {
        return;
      }

      const [adminsAndMods, numVotingThreads] = await (<
        Promise<
          [Array<{ address: string; role: 'admin' | 'moderator' }>, number]
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
      ]));

      return {
        ...result.toJSON(),
        adminsAndMods,
        numVotingThreads,
        communityBanner: result.banner_text,
      } as CommunityAttributes & {
        numVotingThreads: number;
        adminsAndMods: Array<{
          address: string;
          role: 'admin' | 'moderator';
        }>;
        communityBanner: string | undefined;
      };
    },
  };
}
