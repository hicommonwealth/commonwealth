import { logger } from '@hicommonwealth/core';
import { extractMCPMentions } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import {
  CommonMCPServerWithHeaders,
  withMCPAuthUsername,
} from '@hicommonwealth/model/services';

const log = logger(import.meta);

/**
 * Gets all community-enabled MCP servers for a community
 */
export async function getAllMCPServers(
  communityId: string,
): Promise<CommonMCPServerWithHeaders[]> {
  const mcpServers = await models.MCPServer.scope('withPrivateData').findAll({
    include: [
      {
        model: models.MCPServerCommunity,
        where: { community_id: communityId },
        attributes: [],
      },
      {
        model: models.User,
        as: 'AuthUser',
        attributes: ['id', 'profile'],
        required: false,
      },
    ],
  });

  return mcpServers.map((server) => ({
    ...withMCPAuthUsername(server),
    headers: {},
  }));
}

/**
 * Extracts MCP servers mentioned in a comment body
 * Returns the servers that match the mentions found in the text
 */
export async function getMentionedMCPServers(
  communityId: string,
  commentBody: string | undefined,
  requestId: string,
): Promise<CommonMCPServerWithHeaders[]> {
  if (!commentBody) {
    return [];
  }

  const extractedMentions = extractMCPMentions(commentBody);
  if (extractedMentions.length === 0) {
    return [];
  }

  const allServers = await getAllMCPServers(communityId);
  const mentionedServers = allServers.filter((server) =>
    extractedMentions.some(
      (mention) =>
        mention.handle === server.handle && mention.id === String(server.id),
    ),
  );

  if (mentionedServers.length > 0) {
    log.info(
      `[${requestId}] Found ${mentionedServers.length} mentioned MCP servers`,
      {
        serverHandles: mentionedServers.map((s) => s.handle),
      },
    );
  }

  return mentionedServers;
}
