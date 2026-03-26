import { logger } from '@hicommonwealth/core';
import { MCPServer } from '@hicommonwealth/schemas';
import {
  DEFAULT_COMPLETION_MODEL,
  MCP_MENTION_SYMBOL,
  getWhitelistedTools,
  sanitizeContent,
} from '@hicommonwealth/shared';
import OpenAI from 'openai';
import { z } from 'zod';
import { config } from '../../config';

const log = logger(import.meta);

export type CommonMCPServerWithHeaders = z.infer<typeof MCPServer> & {
  headers?: Record<string, string>;
};

/**
 * Applies production-ready server_url and auth headers for the common MCP
 * server (id=1, handle='common').  All other servers are returned as-is
 * with empty headers.
 *
 * Both the AI-completion handler and the demo CLI must call this so that
 * local testing exercises the exact same code path as production.
 */
export function enrichCommonMCPServer(
  server: CommonMCPServerWithHeaders,
): CommonMCPServerWithHeaders {
  if (server.id === 1 && server.handle === 'common') {
    const authToken = config.MCP.MCP_AUTH_TOKEN;
    if (!authToken) {
      log.warn(
        'MCP_AUTH_TOKEN not configured — common MCP server tools will lack auth',
      );
    }
    const headers: Record<string, string> = {
      // Bypass ngrok's browser interstitial for local/dev tunnels (no-op in prod)
      'ngrok-skip-browser-warning': '1',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };
    const serverUrl = `${config.SERVER_URL}/mcp`;
    log.debug(`Common MCP server URL resolved to: ${serverUrl}`);
    return {
      ...server,
      server_url: serverUrl,
      headers,
    };
  }

  return { ...server, headers: server.headers ?? {} };
}

/**
 * Filters servers and their tools based on the tool whitelist.
 * Exported so callers (e.g. getMentionedMCPServers) can apply it before
 * passing servers to buildMCPClientOptions.
 */
export function filterServersWithWhitelist(
  servers: CommonMCPServerWithHeaders[],
): CommonMCPServerWithHeaders[] {
  return servers.map((server) => {
    const whitelistedTools = getWhitelistedTools(server.handle);

    // If no whitelist exists for this server, deny all tools (secure by default)
    if (!whitelistedTools) {
      return {
        ...server,
        tools: [],
      };
    }

    // If wildcard '*' is set, allow all tools
    if (whitelistedTools === '*') {
      return server;
    }

    // Filter the server's tools to only include whitelisted ones
    const filteredTools = server.tools.filter((tool) =>
      whitelistedTools.includes(tool.name),
    );

    return {
      ...server,
      tools: filteredTools,
    };
  });
}

// build MCP agent system prompt from servers list
const buildSystemPrompt = (
  allServers: CommonMCPServerWithHeaders[],
) => `You are an AI assistant with access to MCP (Model Context Protocol) servers that provide tools for interacting with Commonwealth communities, threads, users and more.

Available MCP servers and their mention handles:
${allServers.map((server) => `- ${MCP_MENTION_SYMBOL}${server.handle}: ${server.name} - ${server.description}`).join('\n')}

When a user mentions an MCP server by name in the parent comment, you should use the MCP tools from \
that specific server to help answer their question. Multiple servers can be mentioned in a single message.

If no specific server is mentioned, you can provide general assistance based on your knowledge, but you won't have access to real-time data from the MCP servers.

Always use the appropriate MCP tools when available to provide accurate, up-to-date information about Commonwealth communities, threads, users, and other relevant data.`;

/**
 * Build OpenAI Responses API options for MCP tool use.
 *
 * Expects `servers` to already be mention-filtered and whitelist-filtered
 * (use `getMentionedMCPServers` + `filterServersWithWhitelist` upstream).
 */
export function buildMCPClientOptions(
  userInput: string,
  servers: CommonMCPServerWithHeaders[],
  previousResponseId: string | null,
): OpenAI.Responses.ResponseCreateParamsStreaming {
  const mcpTools = servers.map((server) => ({
    type: 'mcp' as const,
    server_label: server.handle!,
    server_url: server.server_url!,
    allowed_tools: server.tools.map((tool) => tool.name),
    require_approval: 'never' as const,
    headers: server.headers,
  }));

  return {
    model: DEFAULT_COMPLETION_MODEL,
    instructions: buildSystemPrompt(servers),
    tools: mcpTools,
    input: sanitizeContent(userInput),
    previous_response_id: previousResponseId,
    stream: true,
  };
}
