import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
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

      if (private_only) {
        // only return private servers for this community
        const mcpServers = await models.MCPServer.findAll({
          where: { private_community_id: community_id },
          order: [['name', 'ASC']],
        });
        return mcpServers.map((server) => server.toJSON());
      } else {
        // otherwise, return only community-enabled servers (for mentions, etc.)
        const mcpServers = await models.MCPServer.findAll({
          include: [
            {
              model: models.MCPServerCommunity,
              where: { community_id },
              attributes: [],
            },
          ],
          order: [['name', 'ASC']],
        });
        return mcpServers.map((server) => server.toJSON());
      }
    },
  };
}
