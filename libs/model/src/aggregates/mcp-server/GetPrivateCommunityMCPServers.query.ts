import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function GetPrivateCommunityMCPServers(): Query<
  typeof schemas.GetPrivateCommunityMCPServers
> {
  return {
    ...schemas.GetPrivateCommunityMCPServers,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const mcpServers = await models.MCPServer.findAll({
        where: {
          private_community_id: payload.community_id,
        },
        order: [['name', 'ASC']],
      });

      return mcpServers.map((server) => server.toJSON());
    },
  };
}
