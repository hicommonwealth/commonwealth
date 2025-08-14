import { Actor, command, logger, Policy } from '@hicommonwealth/core';
import { events } from '@hicommonwealth/schemas';
import { MCP_BOT_ADDRESS } from '@hicommonwealth/shared';
import { OpenAI } from 'openai';
import { Op } from 'sequelize';
import { CreateComment } from '../aggregates/comment';
import { config } from '../config';
import { models } from '../database';
import {
  buildMCPClientOptions,
  CommonMCPServerWithHeaders,
} from '../services/mcpClient';

const log = logger(import.meta);

const inputs = {
  CommentCreated: events.CommentCreated,
};

let actor: Actor;

async function getActor() {
  if (actor) return actor;

  const userInstance = await models.User.findOne({
    where: { email: config.MCP.BOT_EMAIL },
  });
  if (!userInstance) throw new Error('MCPBot user not found!');

  actor = {
    user: {
      id: userInstance.id!,
      email: userInstance.email!,
      isAdmin: userInstance.isAdmin!,
    },
    address: MCP_BOT_ADDRESS,
  };
  return actor;
}

/**
 * Extracts MCP server mentions from comment text using regex
 * @param commentBody The comment text to parse
 * @returns Array of objects containing handle and id for each mentioned MCP server
 */
function extractMCPMentions(
  commentBody: string,
): Array<{ handle: string; id: string; name: string }> {
  // Regex pattern matches: [@MCPServerName](/mcp-server/handle/id)
  const mcpMentionPattern = /\[%([^\]]+)\]\(\/mcp-server\/([^/]+\/[^)]+)\)/g;
  const mentions: Array<{ handle: string; id: string; name: string }> = [];
  let match;

  while ((match = mcpMentionPattern.exec(commentBody)) !== null) {
    const handleAndId = match[2]; // This will be "handle/id"
    const [handle, id] = handleAndId.split('/');

    if (handle && id) {
      mentions.push({
        name: match[1], // Display name
        handle: handle, // Server handle
        id: id, // Server ID
      });
    }
  }

  return mentions;
}

/**
 * Finds MCP servers that are mentioned in the comment
 * @param commentBody The comment text to parse
 * @param allServers All available MCP servers for the community
 * @returns Array of mentioned MCP servers
 */
function findMentionedMCPServers(
  commentBody: string,
  allServers: CommonMCPServerWithHeaders[],
): CommonMCPServerWithHeaders[] {
  const extractedMentions = extractMCPMentions(commentBody);

  if (extractedMentions.length === 0) {
    return [];
  }

  // Match extracted mentions with available servers by handle and id
  return allServers.filter((server) =>
    extractedMentions.some(
      (mention) =>
        mention.handle === server.handle && mention.id === String(server.id),
    ),
  );
}

/**
 * Gets all available MCP servers for a community
 * @param communityId The community ID
 * @returns Array of MCP servers with headers
 */
async function getAllMCPServers(
  communityId: string,
): Promise<CommonMCPServerWithHeaders[]> {
  const mcpServers = await models.MCPServer.scope('withPrivateData').findAll({
    where: {
      private_community_id: {
        [Op.or]: [communityId, null],
      },
    },
  });

  return mcpServers.map((server) => ({
    ...server.toJSON(),
    headers: {}, // Add any necessary headers for authentication
  }));
}

/**
 * Generates a response using OpenAI with MCP tools
 * @param userInput The comment text to respond to
 * @param allServers Available MCP servers
 * @returns The generated response text
 */
async function generateMCPResponse(
  userInput: string,
  allServers: CommonMCPServerWithHeaders[],
): Promise<string> {
  if (!config.OPENAI.API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: config.OPENAI.API_KEY,
    ...(config.OPENAI.ORGANIZATION && {
      organization: config.OPENAI.ORGANIZATION,
    }),
  });

  try {
    // Use buildMCPClientOptions to configure the request
    const options = buildMCPClientOptions(userInput, allServers, null);
    const response = await openai.responses.create(options);

    // Collect the streaming response
    let responseText = '';
    for await (const event of response) {
      if (event.type === 'response.output_text.delta') {
        const deltaText = event.delta || '';
        responseText += deltaText;
      }
    }

    return (
      responseText || 'I apologize, but I was unable to generate a response.'
    );
  } catch (error) {
    log.error(
      'Error generating MCP response:',
      error instanceof Error ? error : new Error(String(error)),
    );
    throw new Error('Failed to generate response with MCP tools');
  }
}

export function MCPWorker(): Policy<typeof inputs> {
  return {
    inputs,
    body: {
      CommentCreated: async ({ payload }) => {
        try {
          const comment = payload;
          const commentBody = comment.body || '';

          // Get all available MCP servers for the community
          const allServers = await getAllMCPServers(comment.community_id);

          // Find MCP servers that are mentioned in the comment
          const mentionedServers = findMentionedMCPServers(
            commentBody,
            allServers,
          );

          // Only proceed if there are MCP server mentions
          if (mentionedServers.length === 0) {
            log.info(`No MCP server mentions found in comment ${comment.id}`);
            return;
          }

          const extractedMentions = extractMCPMentions(commentBody);
          log.info(
            `Found MCP mentions in comment ${comment.id}: ${extractedMentions.map((m) => `${m.handle}(${m.id})`).join(', ')}`,
          );

          // Generate response using OpenAI with MCP tools
          const responseText = await generateMCPResponse(
            commentBody,
            mentionedServers,
          );

          // Get the thread to reply to
          const thread = await models.Thread.findOne({
            where: { id: comment.thread_id },
            attributes: ['id', 'community_id'],
          });

          if (!thread) {
            log.error(`Thread not found for comment ${comment.id}`);
            return;
          }

          // Create a reply comment with the MCP response
          await command(CreateComment(), {
            actor: await getActor(),
            payload: {
              thread_id: thread.id!,
              body: responseText,
              parent_id: comment.id,
            },
          });

          log.info(`Created MCP response comment for thread ${thread.id}`);
        } catch (error) {
          log.error(
            'Error in MCPWorker CommentCreated handler:',
            error instanceof Error ? error : new Error(String(error)),
          );
          // Don't throw - we don't want to break the entire event processing pipeline
        }
      },
    },
  };
}
