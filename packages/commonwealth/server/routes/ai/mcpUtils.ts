import { config, logger } from '@hicommonwealth/core';
import { extractMCPMentions } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import {
  CommonMCPServerWithHeaders,
  filterServersWithWhitelist,
  withMCPAuthUsername,
} from '@hicommonwealth/model/services';
import { getBaseUrl } from '@hicommonwealth/shared';

const log = logger(import.meta);

const COMMON_MCP_HANDLE = 'common';

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

  return mcpServers.map((server) => {
    const serverData = withMCPAuthUsername(server);

    // Fallback to the app's own MCP endpoint for the built-in common server
    if (serverData.handle === COMMON_MCP_HANDLE && !serverData.server_url) {
      serverData.server_url = `${getBaseUrl(config.APP_ENV)}/mcp`;
      log.info(
        `MCP server "${COMMON_MCP_HANDLE}" has no server_url, falling back to ${serverData.server_url}`,
      );
    }

    return {
      ...serverData,
      headers: {},
    };
  });
}

/**
 * Extracts MCP servers mentioned in a comment body.
 * Returns servers that match the mentions, with whitelist filtering already applied.
 * Callers can pass the result directly to buildMCPClientOptions.
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

  // Apply whitelist filtering so downstream callers don't need to
  const filteredServers = filterServersWithWhitelist(mentionedServers);

  if (filteredServers.length > 0) {
    log.info(
      `[${requestId}] Found ${filteredServers.length} mentioned MCP servers`,
      {
        serverHandles: filteredServers.map((s) => s.handle),
      },
    );
  }

  return filteredServers;
}
