import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetAllMCPServers(): Query<typeof schemas.GetAllMCPServers> {
  return {
    ...schemas.GetAllMCPServers,
    auth: [],
    secure: false,
    body: async () => {
      const mcpServers = await models.MCPServer.findAll({
        order: [['name', 'ASC']],
      });

      return mcpServers.map((server) => server.toJSON());
    },
  };
}
