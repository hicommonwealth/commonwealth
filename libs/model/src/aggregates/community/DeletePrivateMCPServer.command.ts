import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { withMCPAuthUsername } from '../../services/mcpServerHelpers';

export const DeletePrivateMCPServerErrors = {
  InvalidMCPServer: 'MCP server does not exist',
  NotPrivateServer: 'MCP server is not a private server for this community',
};

export function DeletePrivateMCPServer(): Command<
  typeof schemas.DeletePrivateMCPServer
> {
  return {
    ...schemas.DeletePrivateMCPServer,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, mcp_server_id } = payload;

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      // Check that the MCP server exists
      const mcpServer = await models.MCPServer.findOne({
        where: { id: mcp_server_id },
        include: [
          {
            model: models.User,
            as: 'AuthUser',
            attributes: ['id', 'profile'],
            required: false,
          },
        ],
      });

      if (!mcpServer) {
        throw new InvalidInput(DeletePrivateMCPServerErrors.InvalidMCPServer);
      }

      // Check if this is a private server for this community
      if (mcpServer.private_community_id !== community_id) {
        throw new InvalidInput(DeletePrivateMCPServerErrors.NotPrivateServer);
      }

      await models.sequelize.transaction(async (transaction) => {
        // Remove all associations for this server
        await models.MCPServerCommunity.destroy({
          where: {
            mcp_server_id,
          },
          transaction,
        });

        // Delete the private server itself
        await models.MCPServer.destroy({
          where: { id: mcp_server_id },
          transaction,
        });
      });

      return withMCPAuthUsername(mcpServer);
    },
  };
}
