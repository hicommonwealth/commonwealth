import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { authComment, mustBeAuthorizedComment } from '../../middleware';

const DEFAULT_TOKEN_EXPIRATION_MINUTES = 60; // 1 hour

export function CreateAICompletionToken(): Command<
  typeof schemas.CreateAICompletionToken
> {
  return {
    ...schemas.CreateAICompletionToken,
    auth: [authComment({})],
    secure: true,
    body: async ({ actor, payload, context }) => {
      // The comment_id in the payload is the parent comment we're replying to
      // Thread ID is inferred from the parent comment's thread
      const { comment, community_id, thread_id } = mustBeAuthorizedComment(
        actor,
        context,
      );

      const { content } = payload;

      // Fetch the comment author's address to verify ownership
      const commentAuthorAddress = await models.Address.findByPk(
        comment.address_id,
      );

      // Ensure the parent comment was created by the requesting user
      if (commentAuthorAddress?.user_id !== actor.user.id) {
        throw new InvalidState(
          'Parent comment must be created by the requesting user',
        );
      }

      // Calculate expiration time (server-controlled)
      const expires_at = new Date();
      expires_at.setMinutes(
        expires_at.getMinutes() + DEFAULT_TOKEN_EXPIRATION_MINUTES,
      );

      // Create the token
      const tokenRecord = await models.AICompletionToken.create({
        user_id: actor.user.id!,
        community_id,
        thread_id: thread_id!,
        parent_comment_id: comment.id,
        content,
        expires_at,
      });

      return {
        token: tokenRecord.token!,
        expires_at: tokenRecord.expires_at,
        id: tokenRecord.id,
      };
    },
  };
}
