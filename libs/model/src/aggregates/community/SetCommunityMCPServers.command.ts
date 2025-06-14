import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';

export const SetCommunityMCPServersErrors = {
  InvalidMCPServer: 'One or more MCP server IDs do not exist',
};

export function SetCommunityMCPServers(): Command<
  typeof schemas.SetCommunityMCPServers
> {
  return {
    ...schemas.SetCommunityMCPServers,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, mcp_server_ids } = payload;

      const community = await models.Community.findOne({
        where: { id: community_id },
      });
      mustExist('Community', community);

      // check that all MCP server IDs exist
      if (mcp_server_ids.length > 0) {
        const existingMCPServers = await models.MCPServer.findAll({
          where: { id: mcp_server_ids },
          attributes: ['id'],
        });

        const existingIds = existingMCPServers.map((server) => server.id);
        const missingIds = mcp_server_ids.filter(
          (id) => !existingIds.includes(id),
        );

        if (missingIds.length > 0) {
          throw new InvalidInput(SetCommunityMCPServersErrors.InvalidMCPServer);
        }
      }

      await models.sequelize.transaction(async (transaction) => {
        // get existing associations
        const existingAssociations = await models.MCPServerCommunity.findAll({
          where: { community_id },
          attributes: ['mcp_server_id'],
          transaction,
        });

        const existingServerIds = existingAssociations.map(
          (assoc) => assoc.mcp_server_id,
        );

        const toAdd = mcp_server_ids.filter(
          (id) => !existingServerIds.includes(id),
        );
        const toRemove = existingServerIds.filter(
          (id) => !mcp_server_ids.includes(id),
        );

        if (toRemove.length > 0) {
          await models.MCPServerCommunity.destroy({
            where: {
              community_id,
              mcp_server_id: toRemove,
            },
            transaction,
          });
        }

        if (toAdd.length > 0) {
          const newAssociations = toAdd.map((mcp_server_id) => ({
            mcp_server_id,
            community_id,
          }));

          await models.MCPServerCommunity.bulkCreate(newAssociations, {
            transaction,
          });
        }
      });

      // Return the updated list of MCP servers for this community
      const updatedMCPServers = await models.MCPServer.findAll({
        include: [
          {
            model: models.MCPServerCommunity,
            where: { community_id },
            attributes: [],
          },
        ],
      });

      return updatedMCPServers.map((server) => server.toJSON());
    },
  };
}
