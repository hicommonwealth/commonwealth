import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function GetCommunityMCPServers(): Query<
  typeof schemas.GetCommunityMCPServers
> {
  return {
    ...schemas.GetCommunityMCPServers,
    auth: [authRoles('admin', 'moderator', 'member')],
    body: async ({ payload }) => {
      const { community_id, private_only } = payload;

      const whereCondition = private_only
        ? { private_community_id: community_id }
        : {
            private_community_id: {
              [Op.or]: [community_id, null],
            },
          };

      const mcpServers = await models.MCPServer.findAll({
        where: whereCondition,
        order: [['name', 'ASC']],
      });

      return mcpServers.map((server) => server.toJSON());
    },
  };
}
