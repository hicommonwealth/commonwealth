import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authRoles } from '../../middleware';

export function GetAllMCPServers(): Query<typeof schemas.GetAllMCPServers> {
  return {
    ...schemas.GetAllMCPServers,
    auth: [authRoles('admin', 'moderator', 'member')],
    body: async ({ payload }) => {
      const { community_id } = payload;

      const mcpServers = await models.MCPServer.findAll({
        where: {
          private_community_id: {
            [Op.or]: [community_id, null],
          },
        },
        order: [['name', 'ASC']],
      });

      return mcpServers.map((server) => server.toJSON());
    },
  };
}
