import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable } from 'sequelize';
import { models } from '../database';

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

      const community = await models.Community.findOne({
        where: where,
        include: include,
      });

      return {
        ...community?.toJSON(),
        CommunityTags: (community?.toJSON()?.CommunityTags || []).map(
          (ct: any) => ct.Tag,
        ),
      };
    },
  };
}
