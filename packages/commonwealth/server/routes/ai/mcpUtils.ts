import { logger } from '@hicommonwealth/core';
import { extractMCPMentions } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import {
  CommonMCPServerWithHeaders,
  isBotAddress,
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
 * Finds the ancestor comment that contains MCP mentions by traversing up the comment tree
 * Stops when it finds a non-bot comment with MCP mentions or reaches the root
 * @returns The comment body containing MCP mentions, or undefined if not found
 */
async function findAncestorMCPMentions(
  commentId: number,
  requestId: string,
  maxDepth = 10,
): Promise<string | undefined> {
  let currentCommentId: number | null = commentId;
  let depth = 0;

  while (currentCommentId && depth < maxDepth) {
    const comment = await models.Comment.findByPk(currentCommentId, {
      attributes: ['id', 'parent_id', 'body', 'address_id'],
    });

    if (!comment) {
      break;
    }

    // Check if this comment has MCP mentions
    const mentions = extractMCPMentions(comment.body);
    if (mentions.length > 0) {
      log.info(`[${requestId}] Found MCP mentions in ancestor comment`, {
        commentId: comment.id,
        mentionCount: mentions.length,
        depth,
      });
      return comment.body;
    }

    // Check if this is a bot comment - if not, we've reached a user comment without MCP mentions
    const isBot = await isBotAddress(comment.address_id);
    if (!isBot) {
      // This is a user comment without MCP mentions, stop searching
      break;
    }

    // Move to parent comment
    currentCommentId = comment.parent_id;
    depth++;
  }

  return undefined;
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

/**
 * Gets MCP servers for a comment, including from ancestor comments if the parent is an AI bot comment
 * This enables conversation continuity when users reply to AI bot comments
 *
 * @param communityId - The community ID
 * @param userCommentBody - The user's comment body (may contain MCP mentions)
 * @param parentCommentId - The parent comment ID that the user is replying to
 * @param requestId - Request ID for logging
 * @returns Combined MCP servers from user's comment and ancestor comments
 */
export async function getMentionedMCPServersWithAncestors(
  communityId: string,
  userCommentBody: string | undefined,
  parentCommentId: number | undefined,
  requestId: string,
): Promise<CommonMCPServerWithHeaders[]> {
  const allServers = await getAllMCPServers(communityId);
  if (allServers.length === 0) {
    return [];
  }

  const allMentions = new Set<string>(); // Use handle:id as key for deduplication

  // Extract mentions from user's comment
  if (userCommentBody) {
    const userMentions = extractMCPMentions(userCommentBody);
    userMentions.forEach((m) => allMentions.add(`${m.handle}:${m.id}`));

    if (userMentions.length > 0) {
      log.info(
        `[${requestId}] Found ${userMentions.length} MCP mentions in user comment`,
      );
    }
  }

  // Check if parent comment is from the AI bot and find ancestor MCP mentions
  if (parentCommentId) {
    const parentComment = await models.Comment.findByPk(parentCommentId, {
      attributes: ['id', 'parent_id', 'body', 'address_id'],
    });

    if (parentComment) {
      const isParentBot = await isBotAddress(parentComment.address_id);

      if (isParentBot) {
        log.info(
          `[${requestId}] Parent comment is from AI bot, searching for ancestor MCP mentions`,
        );

        // The parent is an AI bot comment, look for MCP mentions in the bot's parent (grandparent)
        if (parentComment.parent_id) {
          const ancestorBody = await findAncestorMCPMentions(
            parentComment.parent_id,
            requestId,
          );

          if (ancestorBody) {
            const ancestorMentions = extractMCPMentions(ancestorBody);
            ancestorMentions.forEach((m) =>
              allMentions.add(`${m.handle}:${m.id}`),
            );

            log.info(
              `[${requestId}] Found ${ancestorMentions.length} MCP mentions from ancestor comments`,
            );
          }
        }
      } else {
        // Parent is a regular user comment, extract mentions from it
        const parentMentions = extractMCPMentions(parentComment.body);
        parentMentions.forEach((m) => allMentions.add(`${m.handle}:${m.id}`));

        if (parentMentions.length > 0) {
          log.info(
            `[${requestId}] Found ${parentMentions.length} MCP mentions in parent comment`,
          );
        }
      }
    }
  }

  if (allMentions.size === 0) {
    return [];
  }

  // Match mentions with available servers
  const mentionedServers = allServers.filter((server) => {
    const key = `${server.handle}:${server.id}`;
    return allMentions.has(key);
  });

  if (mentionedServers.length > 0) {
    log.info(
      `[${requestId}] Found ${mentionedServers.length} total MCP servers (including ancestors)`,
      {
        serverHandles: mentionedServers.map((s) => s.handle),
      },
    );
  }

  return mentionedServers;
}
