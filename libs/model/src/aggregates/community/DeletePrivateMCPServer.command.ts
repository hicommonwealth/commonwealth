import { InvalidInput, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { KlavisClient } from 'klavis';
import { config } from '../../config';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { withMCPAuthUsername } from '../../services/mcpServerHelpers';

const log = logger(import.meta);

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

      // Check that the MCP server exists and get private data for cleanup
      const mcpServer = await models.MCPServer.scope('withPrivateData').findOne(
        {
          where: { id: mcp_server_id },
          include: [
            {
              model: models.User,
              as: 'AuthUser',
              attributes: ['id', 'profile'],
              required: false,
            },
          ],
        },
      );

      if (!mcpServer) {
        throw new InvalidInput(DeletePrivateMCPServerErrors.InvalidMCPServer);
      }

      // Check if this is a private server for this community
      if (mcpServer.private_community_id !== community_id) {
        throw new InvalidInput(DeletePrivateMCPServerErrors.NotPrivateServer);
      }

      // Store server info before deletion for cleanup
      const serverUrl = mcpServer.server_url;
      const source = mcpServer.source;
      const sourceIdentifier = mcpServer.source_identifier;

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

      // After deletion, check if there are other servers with the same URL
      if (serverUrl && source === 'klavis' && sourceIdentifier) {
        const otherServersWithSameUrl = await models.MCPServer.scope(
          'withPrivateData',
        ).count({
          where: {
            server_url: serverUrl,
          },
        });

        // If no other servers share this URL, delete the instance from Klavis
        if (otherServersWithSameUrl === 0) {
          try {
            if (config.KLAVIS.API_KEY) {
              const klavis = new KlavisClient({
                apiKey: config.KLAVIS.API_KEY,
              });
              await klavis.mcpServer.deleteServerInstance(sourceIdentifier);
              log.info(`Deleted Klavis instance ${sourceIdentifier}`);
            }
          } catch (error) {
            // Log the error but don't fail the deletion
            log.error(
              `Failed to delete Klavis instance ${sourceIdentifier}:`,
              error as Error,
            );
          }
        }
      }

      return withMCPAuthUsername(mcpServer);
    },
  };
}
