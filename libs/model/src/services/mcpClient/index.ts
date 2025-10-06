import { config } from '@hicommonwealth/core';
import { MCPServer } from '@hicommonwealth/schemas';
import {
  DEFAULT_COMPLETION_MODEL,
  MCP_MENTION_SYMBOL,
} from '@hicommonwealth/shared';
import OpenAI from 'openai';
import { z } from 'zod';
import { extractMCPMentions } from '../..';

export type CommonMCPServerWithHeaders = z.infer<typeof MCPServer> & {
  headers?: Record<string, string>;
};

// build MCP agent system prompt from servers list
const buildSystemPrompt = (
  allServers: CommonMCPServerWithHeaders[],
) => `You are an AI assistant with access to MCP (Model Context Protocol) servers that provide tools for interacting with Commonwealth communities, threads, users and more.

Available MCP servers and their mention handles:
${allServers.map((server) => `- ${MCP_MENTION_SYMBOL}${server.handle}: ${server.name} - ${server.description}`).join('\n')}

When a user mentions a server using the format [${MCP_MENTION_SYMBOL}ServerName](/mcp-server/handle/id), you should use the MCP tools from that specific server to help answer their question. Multiple servers can be mentioned in a single message.

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
  if (config.APP_ENV === 'local') {
    console.log('mentionedServers: ', mentionedServers);
  }
  return {
    model: DEFAULT_COMPLETION_MODEL,
    instructions: buildSystemPrompt(mentionedServers),
    tools: mentionedServers.map((server) => ({
      type: 'mcp',
      server_label: server.handle!,
      server_url: server.server_url!,
      require_approval: 'never',
      headers: server.headers,
    })),
    input: userInput,
    previous_response_id: previousResponseId,
    stream: true,
  };
}
