/**
 * AI Context Builder
 *
 * Builds context from entity IDs for AI prompt generation.
 * This module fetches entity data and formats it for inclusion in prompts.
 */

import { Op } from 'sequelize';
import { models } from '../../database';

// Configuration for context limits
const CONTEXT_CONFIG = {
  MAX_RECENT_COMMENTS: 3,
  MAX_RECENT_THREADS: 5,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CONTEXT_LENGTH: 2000,
};

export interface AICompletionEntityIds {
  parentCommentId?: number;
  topicId?: number;
}

export interface AICompletionContext {
  community: {
    name: string;
    description: string | null;
  };
  thread?: {
    id: number;
    title: string;
    body: string;
    topicName: string;
  };
  parentComment?: {
    id: number;
    body: string;
    authorName: string;
  };
  topic?: {
    id: number;
    name: string;
    description: string | null;
  };
}

/**
 * Fetches and builds context from entity IDs
 * Verifies all entities belong to the specified community
 */
export async function buildContextFromEntityIds(
  communityId: string,
  entityIds: AICompletionEntityIds,
): Promise<AICompletionContext> {
  // Fetch community info (required)
  const community = await models.Community.findByPk(communityId, {
    attributes: ['id', 'name', 'description'],
  });

  if (!community) {
    throw new Error(`Community not found: ${communityId}`);
  }

  const context: AICompletionContext = {
    community: {
      name: community.name!,
      description: community.description || null,
    },
  };

  // Fetch parent comment if specified - also infers thread context
  if (entityIds.parentCommentId) {
    const comment = await models.Comment.findOne({
      where: {
        id: entityIds.parentCommentId,
        deleted_at: null,
      },
      include: [
        {
          model: models.Address,
          required: true,
          include: [
            {
              model: models.User,
              required: true,
              attributes: ['profile'],
            },
          ],
        },
        {
          model: models.Thread,
          required: true,
          attributes: ['id', 'community_id', 'title', 'body'],
          include: [
            {
              model: models.Topic,
              as: 'topic',
              attributes: ['name'],
            },
          ],
        },
      ],
      attributes: ['id', 'body', 'thread_id'],
    });

    if (!comment) {
      throw new Error(`Comment ${entityIds.parentCommentId} not found`);
    }

    // Verify comment belongs to the community
    if (comment.Thread?.community_id !== communityId) {
      throw new Error(
        `Comment ${entityIds.parentCommentId} does not belong to community ${communityId}`,
      );
    }

    const authorProfile = comment.Address?.User?.profile as { name?: string };
    context.parentComment = {
      id: comment.id!,
      body: truncateText(comment.body, CONTEXT_CONFIG.MAX_CONTEXT_LENGTH),
      authorName: authorProfile?.name || 'Anonymous',
    };

    // Infer thread context from parent comment's thread
    if (comment.Thread) {
      context.thread = {
        id: comment.Thread.id!,
        title: comment.Thread.title,
        body: truncateText(
          comment.Thread.body || '',
          CONTEXT_CONFIG.MAX_CONTEXT_LENGTH,
        ),
        topicName: comment.Thread.topic?.name || 'General',
      };
    }
  }

  // Fetch topic if specified
  if (entityIds.topicId) {
    const topic = await models.Topic.findOne({
      where: {
        id: entityIds.topicId,
        community_id: communityId,
      },
      attributes: ['id', 'name', 'description'],
    });

    if (!topic) {
      throw new Error(
        `Topic ${entityIds.topicId} not found in community ${communityId}`,
      );
    }

    context.topic = {
      id: topic.id!,
      name: topic.name!,
      description: topic.description || null,
    };
  }

  return context;
}

/**
 * Formats the context into a string suitable for prompt injection
 */
export function formatContextForPrompt(context: AICompletionContext): string {
  const parts: string[] = [];

  // Community context
  parts.push(`Community: ${context.community.name}`);
  if (context.community.description) {
    parts.push(
      `Community Description: ${truncateText(context.community.description, CONTEXT_CONFIG.MAX_DESCRIPTION_LENGTH)}`,
    );
  }

  // Topic context
  if (context.topic) {
    parts.push(`Topic: ${context.topic.name}`);
    if (context.topic.description) {
      parts.push(
        `Topic Description: ${truncateText(context.topic.description, CONTEXT_CONFIG.MAX_DESCRIPTION_LENGTH)}`,
      );
    }
  }

  // Thread context
  if (context.thread) {
    parts.push(`Thread Title: ${context.thread.title}`);
    if (context.thread.body) {
      parts.push(`Thread Content: ${context.thread.body}`);
    }
  }

  // Parent comment context
  if (context.parentComment) {
    parts.push(
      `Parent Comment by ${context.parentComment.authorName}: ${context.parentComment.body}`,
    );
  }

  return parts.join('\n\n');
}

/**
 * Aggregates context for MCP server mentions
 */
export async function aggregateMCPServerContext(
  mcpServerId: number,
  communityId: string,
): Promise<string> {
  const serverResult = await models.MCPServer.findOne({
    where: {
      id: mcpServerId,
      [Op.or]: [
        { auth_required: false },
        { auth_required: true, auth_completed: true },
      ],
    },
    include: [
      {
        model: models.MCPServerCommunity,
        where: { community_id: communityId },
        required: true,
      },
    ],
  });

  if (!serverResult) {
    throw new Error(
      `MCP server ${mcpServerId} not found or not accessible in community ${communityId}`,
    );
  }

  const serverName = serverResult.name || 'Unknown MCP Server';

  let contextData = `MCP Server: ${serverName}\n`;
  contextData += `Handle: ${serverResult.handle}\n`;

  if (serverResult.description) {
    contextData += `Description: ${truncateText(serverResult.description, CONTEXT_CONFIG.MAX_DESCRIPTION_LENGTH)}\n`;
  }

  // List available tools
  if (serverResult.tools && serverResult.tools.length > 0) {
    contextData += `\nAvailable Tools (${serverResult.tools.length}):\n`;
    serverResult.tools.slice(0, 10).forEach((tool, index) => {
      contextData += `${index + 1}. ${tool.name}`;
      if (tool.description) {
        const desc = truncateText(tool.description, 100);
        contextData += `: ${desc}`;
      }
      contextData += '\n';
    });

    if (serverResult.tools.length > 10) {
      contextData += `... and ${serverResult.tools.length - 10} more tools\n`;
    }
  }

  return contextData;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
