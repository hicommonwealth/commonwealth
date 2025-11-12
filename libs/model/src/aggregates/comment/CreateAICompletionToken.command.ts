import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import {
  authThread,
  mustBeAuthorizedThread,
  mustExist,
} from '../../middleware';

const DEFAULT_TOKEN_EXPIRATION_MINUTES = 60; // 1 hour

export function CreateAICompletionToken(): Command<
  typeof schemas.CreateAICompletionToken
> {
  return {
    ...schemas.CreateAICompletionToken,
    auth: [authThread({})],
    secure: true,
    body: async ({ actor, payload, context }) => {
      const { thread, community_id } = mustBeAuthorizedThread(actor, context);

      const { parent_comment_id, content } = payload;

      // Verify parent comment exists if specified
      let parentComment = null;
      if (parent_comment_id) {
        parentComment = await models.Comment.findOne({
          where: {
            id: parent_comment_id,
            thread_id: thread.id,
          },
        });
        mustExist('Parent Comment', parentComment);
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
        thread_id: thread.id!,
        parent_comment_id,
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
