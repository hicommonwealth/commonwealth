import { command, InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';
import { systemActor } from '../../middleware/auth';
import { mustExist } from '../../middleware/guards';
import { getBotUser } from '../../utils/botUser';
import { JoinCommunity } from '../community';
import { CreateComment } from './CreateComment.command';

export const CreateAICompletionCommentErrors = {
  TokenNotFound: 'AI completion token not found',
  TokenExpired: 'AI completion token has expired',
  TokenAlreadyUsed: 'AI completion token has already been used',
  BotUserNotFound: 'AI bot user not found',
  BotAddressNotFound: 'Bot user address not found in community',
};

export function CreateAICompletionComment(): Command<
  typeof schemas.CreateAICompletionComment
> {
  return {
    ...schemas.CreateAICompletionComment,
    auth: [],
    body: async ({ payload }) => {
      const { token } = payload;

      // Find the token in the database
      const completionToken = await models.AICompletionToken.findOne({
        where: { token, used_at: null },
      });

      if (!completionToken) {
        throw new InvalidState(CreateAICompletionCommentErrors.TokenNotFound);
      }

      // Check if token has expired
      if (new Date() > completionToken.expires_at) {
        throw new InvalidState(CreateAICompletionCommentErrors.TokenExpired);
      }

      // Get the bot user with address
      const { user: botUser, address: botUserAddress } = await getBotUser();
      if (!botUser) {
        throw new InvalidState(CreateAICompletionCommentErrors.BotUserNotFound);
      }

      // Find the bot user's address in the specific community
      let botAddress = await models.Address.findOne({
        where: {
          user_id: botUser.id,
          community_id: completionToken.community_id,
        },
      });

      if (!botAddress) {
        // Join community using the bot's primary address
        const botActor = systemActor({
          address: botUserAddress.address,
          id: botUser.id!,
          email: botUser.email || 'ai-bot@common.xyz',
        });

        await command(JoinCommunity(), {
          actor: botActor,
          payload: { community_id: completionToken.community_id },
        });

        // Fetch the newly created address
        const newBotAddress = await models.Address.findOne({
          where: {
            user_id: botUser.id,
            community_id: completionToken.community_id,
          },
        });

        if (!newBotAddress) {
          throw new InvalidState(
            CreateAICompletionCommentErrors.BotAddressNotFound,
          );
        }

        botAddress = newBotAddress;
      }

      // Get the thread to use as context
      const thread = await models.Thread.findByPk(completionToken.thread_id);
      mustExist('Thread', thread);

      // Create a system actor for the bot user
      const mockActor = systemActor({
        address: botAddress.address,
        id: botUser.id!,
        email: botUser.email || 'ai-bot@common.xyz',
      });

      // Create a proper context that matches ThreadContext structure
      const mockContext = {
        thread_id: completionToken.thread_id,
        address: {
          address: botAddress.address,
          community_id: completionToken.community_id,
          ghost_address: botAddress.ghost_address || false,
          role: botAddress.role || ('member' as const),
          is_banned: botAddress.is_banned || false,
          id: botAddress.id!,
          user_id: botUser.id!,
          created_at: botAddress.created_at,
          updated_at: botAddress.updated_at,
          last_active: botAddress.last_active,
          verification_token: botAddress.verification_token,
          verified: botAddress.verified,
          verification_token_expires: botAddress.verification_token_expires,
          block_info: botAddress.block_info,
          hex: botAddress.hex,
          wallet_id: botAddress.wallet_id,
          oauth_provider: botAddress.oauth_provider,
          oauth_email: botAddress.oauth_email,
          oauth_email_verified: botAddress.oauth_email_verified,
          oauth_username: botAddress.oauth_username,
          oauth_phone_number: botAddress.oauth_phone_number,
          oauth_user_id: botAddress.oauth_user_id,
        },
        community_id: completionToken.community_id,
        is_author: false,
        is_collaborator: false,
        thread,
      };

      // Prepare the comment payload for CreateComment
      const commentPayload = {
        thread_id: completionToken.thread_id,
        parent_id: completionToken.parent_comment_id || undefined,
        body: completionToken.content,
      };

      // Use the existing CreateComment command
      const createCommentCommand = CreateComment();
      const result = await createCommentCommand.body({
        actor: mockActor,
        payload: commentPayload,
        context: mockContext,
      });

      // Mark the token as used and store the comment_id after successful comment creation
      await models.AICompletionToken.update(
        { used_at: new Date(), comment_id: result.id },
        { where: { id: completionToken.id } },
      );

      return result;
    },
  };
}
