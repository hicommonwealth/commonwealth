import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Includeable, Op } from 'sequelize';
import { models } from '../../database';
import { CommunityAttributes } from '../../models';

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

      if (payload.include_groups) {
        include.push({
          model: models.Group,
          as: 'groups',
          required: false,
        });
      }

      if (payload.include_node_info) {
        include.push({
          model: models.ChainNode,
          required: false,
        });
      }

      if (payload.include_mcp_servers) {
        include.push({
          model: models.MCPServerCommunity,
          required: false,
          include: [
            {
              model: models.MCPServer,
              required: false,
            },
          ],
        });
      }

      const result = await models.Community.findOne({
        where,
        include,
      });

      if (!result) {
        return;
      }

      const adminsAndMods = await models.Address.findAll({
        where: {
          community_id: payload.id,
          [Op.or]: [{ role: 'admin' }, { role: 'moderator' }],
        },
        attributes: ['address', 'role'],
      });

      return {
        ...result.toJSON(),
        adminsAndMods,
        communityBanner: result.banner_text,
        ai_features_enabled: result.ai_features_enabled,
      } as CommunityAttributes & {
        adminsAndMods: Array<{
          address: string;
          role: 'admin' | 'moderator';
        }>;
        communityBanner: string | undefined;
        ai_features_enabled: boolean;
      };
    },
  };
}
