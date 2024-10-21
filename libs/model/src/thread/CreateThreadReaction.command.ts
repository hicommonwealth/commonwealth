import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isAuthorized, type AuthContext } from '../middleware';
import { verifyReactionSignature } from '../middleware/canvas';
import { mustBeAuthorizedThread } from '../middleware/guards';
import { getVotingWeight } from '../services/stakeHelper';

export const CreateThreadReactionErrors = {
  ThreadArchived: 'Thread is archived',
};

export function CreateThreadReaction(): Command<
  typeof schemas.CreateThreadReaction,
  AuthContext
> {
  return {
    ...schemas.CreateThreadReaction,
    auth: [
      isAuthorized({
        action: schemas.PermissionEnum.CREATE_THREAD_REACTION,
      }),
      verifyReactionSignature,
    ],
    body: async ({ payload, actor, auth }) => {
      const { address, thread } = mustBeAuthorizedThread(actor, auth);

      if (thread.archived_at)
        throw new InvalidState(CreateThreadReactionErrors.ThreadArchived);

      const calculated_voting_weight = await getVotingWeight(
        thread.topic_id!,
        address.address,
      );

      // == mutation transaction boundary ==
      const new_reaction_id = await models.sequelize.transaction(
        async (transaction) => {
          const [reaction] = await models.Reaction.findOrCreate({
            where: {
              address_id: address.id,
              thread_id: thread.id,
              reaction: payload.reaction,
            },
            defaults: {
              address_id: address.id!,
              thread_id: thread.id,
              reaction: payload.reaction,
              calculated_voting_weight: calculated_voting_weight?.toString(),
              canvas_msg_id: payload.canvas_msg_id,
              canvas_signed_data: payload.canvas_signed_data,
            },
            transaction,
          });

          return reaction.id;
        },
      );
      // == end of transaction boundary ==

      const reaction = await models.Reaction.findOne({
        where: { id: new_reaction_id },
        include: [{ model: models.Address, include: [models.User] }],
      });
      return {
        ...reaction!.toJSON(),
        community_id: thread.community_id,
      };
    },
  };
}
