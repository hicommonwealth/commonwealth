import { MCPServer } from '@hicommonwealth/schemas';
import {
  DEFAULT_COMPLETION_MODEL,
  MCP_MENTION_SYMBOL,
  getWhitelistedTools,
} from '@hicommonwealth/shared';
import OpenAI from 'openai';
import { z } from 'zod';
import { extractMCPMentions } from '../..';

export type CommonMCPServerWithHeaders = z.infer<typeof MCPServer> & {
  headers?: Record<string, string>;
};

// Function to filter servers and their tools based on whitelist
function filterServersWithWhitelist(
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

When a user mentions an MCP server by name, you should use the MCP tools from that specific server to help answer their question. Multiple servers can be mentioned in a single message.

If no specific server is mentioned, you can provide general assistance based on your knowledge, but you won't have access to real-time data from the MCP servers.

Always use the appropriate MCP tools when available to provide accurate, up-to-date information about Commonwealth communities, threads, users, and other relevant data.`;

// build reusable MCP client options
export function buildMCPClientOptions(
  userInput: string,
  allServers: CommonMCPServerWithHeaders[],
  previousResponseId: string | null,
): OpenAI.Responses.ResponseCreateParamsStreaming {
  // Extract MCP mentions from user input
  const extractedMentions = extractMCPMentions(userInput);

  // Match extracted mentions with available servers by handle and id
  const mentionedServers = allServers.filter((server) =>
    extractedMentions.some(
      (mention) =>
        mention.handle === server.handle && mention.id === String(server.id),
    ),
  );

  // Apply whitelist filtering to mentioned servers
  const filteredServers = filterServersWithWhitelist(mentionedServers);

  // Build MCP tools array with allowed_tools filter for each server
  const mcpTools = filteredServers.map((server) => ({
    type: 'mcp' as const,
    server_label: server.handle!,
    server_url: server.server_url!,
    allowed_tools: server.tools.map((tool) => tool.name),
    require_approval: 'never' as const,
    headers: server.headers,
  }));

  return {
    model: DEFAULT_COMPLETION_MODEL,
    instructions: buildSystemPrompt(filteredServers),
    tools: mcpTools,
    input: userInput,
    previous_response_id: previousResponseId,
    stream: true,
  };
}
