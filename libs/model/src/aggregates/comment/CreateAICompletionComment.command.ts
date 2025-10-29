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
        where: { token },
      });

      if (!completionToken) {
        throw new InvalidState(CreateAICompletionCommentErrors.TokenNotFound);
      }

      if (completionToken.used_at) {
        throw new InvalidState(
          CreateAICompletionCommentErrors.TokenAlreadyUsed,
        );
      }

      if (new Date() > completionToken.expires_at) {
        throw new InvalidState(CreateAICompletionCommentErrors.TokenExpired);
      }

      // Get the bot user with address
      const botUserData = await getBotUser();
      if (!botUserData) {
        throw new InvalidState(CreateAICompletionCommentErrors.BotUserNotFound);
      }
      const { user: botUser, address: botUserAddress } = botUserData;

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

      const result = await command(CreateComment(), {
        actor: systemActor({
          address: botAddress.address,
          id: botUser.id!,
          email: botUser.email || 'ai-bot@common.xyz',
        }),
        payload: {
          thread_id: completionToken.thread_id,
          parent_id: completionToken.parent_comment_id || undefined,
          body: completionToken.content,
        },
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
