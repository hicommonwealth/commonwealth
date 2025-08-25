import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export const CreateAICompletionTokenErrors = {
  ThreadNotFound: 'Thread not found',
  CommunityNotFound: 'Community not found',
  ParentCommentNotFound: 'Parent comment not found',
  UserNotFound: 'User not found',
};

export function CreateAICompletionToken(): Command<
  typeof schemas.CreateAICompletionToken
> {
  return {
    ...schemas.CreateAICompletionToken,
    auth: [], // Handled at the endpoint level where this is called
    body: async ({ payload }) => {
      const {
        user_id,
        community_id,
        thread_id,
        parent_comment_id,
        content,
        expires_in_minutes,
      } = payload;

      // Verify user exists
      const user = await models.User.findByPk(user_id);
      if (!user) {
        throw new InvalidState(CreateAICompletionTokenErrors.UserNotFound);
      }

      // Verify thread exists and belongs to the community
      const thread = await models.Thread.findOne({
        where: {
          id: thread_id,
          community_id: community_id,
        },
      });
      if (!thread) {
        throw new InvalidState(CreateAICompletionTokenErrors.ThreadNotFound);
      }

      // Verify community exists
      const community = await models.Community.findByPk(community_id);
      if (!community) {
        throw new InvalidState(CreateAICompletionTokenErrors.CommunityNotFound);
      }

      // Verify parent comment exists if specified
      if (parent_comment_id) {
        const parentComment = await models.Comment.findOne({
          where: {
            id: parent_comment_id,
            thread_id: thread_id,
          },
        });
        if (!parentComment) {
          throw new InvalidState(
            CreateAICompletionTokenErrors.ParentCommentNotFound,
          );
        }
      }

      // Calculate expiration time
      const expires_at = new Date();
      expires_at.setMinutes(expires_at.getMinutes() + expires_in_minutes);

      // Create the token
      const tokenRecord = await models.AICompletionToken.create({
        user_id,
        community_id,
        thread_id,
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
