import { logger } from '@hicommonwealth/core';
import { extractMCPMentions } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import {
  CommonMCPServerWithHeaders,
  filterServersWithWhitelist,
  withMCPAuthUsername,
} from '@hicommonwealth/model/services';
import { buildMCPTools } from '../../api/mcp-server';
import { config } from '../../config';

const log = logger(import.meta);

// Cache the common MCP server tool names (static at runtime)
let commonMCPToolNames: Array<{ name: string; description: string }> | null =
  null;

function getCommonMCPToolNames() {
  if (!commonMCPToolNames) {
    commonMCPToolNames = buildMCPTools().map((t) => ({
      name: t.name,
      description: t.description,
    }));
  }
  return commonMCPToolNames;
}

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
    const serverJson = withMCPAuthUsername(server);

    // For the common MCP server, override server_url and headers from config
    // so OpenAI's servers can reach it with proper authentication
    if (server.id === 1 && server.handle === 'common') {
      const authToken = config.MCP.MCP_AUTH_TOKEN;
      if (!authToken) {
        log.warn(
          'MCP_AUTH_TOKEN not configured — common MCP server tools will fail auth',
        );
      }
      return {
        ...serverJson,
        server_url: `${config.SERVER_URL}/mcp`,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      };
    }

    return {
      ...serverJson,
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

  // Enrich the common server's tools from the adapter instead of the DB
  const enrichedServers = mentionedServers.map((server) => {
    if (server.handle === 'common' && server.id === 1) {
      return {
        ...server,
        tools: getCommonMCPToolNames(),
      };
    }
    return server;
  });

  // Apply whitelist filtering so downstream callers don't need to
  const filteredServers = filterServersWithWhitelist(enrichedServers);

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
