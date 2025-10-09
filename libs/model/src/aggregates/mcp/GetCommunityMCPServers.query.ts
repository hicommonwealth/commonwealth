import { type Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { isToolWhitelisted } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import z from 'zod';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { withMCPAuthUsername } from '../../services/mcpServerHelpers';

function formatMCPServerDescription(server: z.infer<typeof schemas.MCPServer>) {
  const whitelistedTools = server.tools.filter((tool) =>
    isToolWhitelisted(server.handle, tool.name),
  );
  let desc = `${server.description}`;
  if (whitelistedTools.length > 0) {
    desc += `\n\nCapabilities:\n${whitelistedTools.map((tool) => '- ' + tool.description).join('\n')}`;
  }
  return desc;
}

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
        // or public servers that are not associated with a community
        // (for MCP Integration page)
        const mcpServers = await models.MCPServer.findAll({
          where: {
            [Op.or]: [
              { private_community_id: community_id },
              { private_community_id: null },
            ],
          },
          include: [
            {
              model: models.User,
              as: 'AuthUser',
              attributes: ['id', 'profile'],
              required: false,
            },
          ],
          order: [['name', 'ASC']],
        });
        return mcpServers.map((server) => ({
          ...withMCPAuthUsername(server),
          description: formatMCPServerDescription(server),
        }));
      } else {
        // otherwise, return only community-enabled servers (for mentions, etc.)
        const mcpServers = await models.MCPServer.findAll({
          include: [
            {
              model: models.MCPServerCommunity,
              where: { community_id },
              attributes: [],
              required: true,
            },
            {
              model: models.User,
              as: 'AuthUser',
              attributes: ['id', 'profile'],
              required: false,
            },
          ],
          order: [['name', 'ASC']],
        });
        return mcpServers.map((server) => ({
          ...withMCPAuthUsername(server),
          description: formatMCPServerDescription(server),
        }));
      }
    },
  };
}
