import { command, logger } from '@hicommonwealth/core';
import { Comment, Community } from '@hicommonwealth/model';
import { models } from '@hicommonwealth/model/db';
import { systemActor } from '@hicommonwealth/model/middleware';
import { getBotUser } from '@hicommonwealth/model/services';

const log = logger(import.meta);

const DEFAULT_TOKEN_EXPIRATION_MINUTES = 60; // 1 hour (for audit token record)

export interface AICommentCreationResult {
  success: boolean;
  commentId?: number;
  comment?: Record<string, unknown>;
  error?: string;
}

/**
 * Creates an AI-generated comment as the bot user
 * This handles: getting bot user, joining community if needed, creating the comment, and storing the token
 *
 * @param parentCommentId - The parent comment ID for nested replies, or null for root-level comments
 */
export async function createAIComment(
  userId: number,
  communityId: string,
  threadId: number,
  parentCommentId: number | null,
  content: string,
): Promise<AICommentCreationResult> {
  try {
    // Get the bot user with address
    const botUserData = await getBotUser();
    if (!botUserData) {
      log.error('Bot user not found for AI comment creation');
      return { success: false, error: 'Bot user not configured' };
    }
    const { user: botUser, address: botUserAddress } = botUserData;

    // Find the bot user's address in the specific community
    let botAddress = await models.Address.findOne({
      where: {
        user_id: botUser.id,
        community_id: communityId,
      },
    });

    if (!botAddress) {
      // Join community using the bot's primary address
      const botActor = systemActor({
        address: botUserAddress.address,
        id: botUser.id!,
        email: botUser.email || 'ai-bot@common.xyz',
      });

      await command(Community.JoinCommunity(), {
        actor: botActor,
        payload: { community_id: communityId },
      });

      // Fetch the newly created address
      botAddress = await models.Address.findOne({
        where: {
          user_id: botUser.id,
          community_id: communityId,
        },
      });

      if (!botAddress) {
        log.error(`Failed to create bot address in community: ${communityId}`);
        return { success: false, error: 'Failed to join community as bot' };
      }
    }

    // Create comment as bot user (system actor bypasses turnstile/tiered middleware)
    const result = await command(Comment.CreateComment(), {
      actor: systemActor({
        id: botUser.id!,
        email: botUser.email || 'ai-bot@common.xyz',
        address: botAddress.address,
      }),
      payload: {
        thread_id: threadId,
        parent_id: parentCommentId ?? undefined,
        body: content,
      },
    });

    // Create audit token record AFTER successful comment creation
    // This prevents orphaned token records if comment creation fails
    const expires_at = new Date();
    expires_at.setMinutes(
      expires_at.getMinutes() + DEFAULT_TOKEN_EXPIRATION_MINUTES,
    );

    await models.AICompletionToken.create({
      user_id: userId,
      community_id: communityId,
      thread_id: threadId,
      parent_comment_id: parentCommentId ?? undefined,
      content,
      expires_at,
      used_at: new Date(),
      comment_id: result!.id,
    });

    log.info('AI comment created successfully', {
      commentId: result!.id,
    });

    // Return the comment object directly — UI handles view transformation
    return {
      success: true,
      commentId: result!.id,
      comment: result as unknown as Record<string, unknown>,
    };
  } catch (error) {
    log.error('Failed to create AI comment', error as Error);
    return { success: false, error: 'Failed to create AI comment' };
  }
}
