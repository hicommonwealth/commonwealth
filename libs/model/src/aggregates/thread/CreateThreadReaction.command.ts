import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { GatedActionEnum } from '@hicommonwealth/shared';
import { models } from '../../database';
import { authThread, mustExist, tiered } from '../../middleware';
import { verifyReactionSignature } from '../../middleware/canvas';
import { mustBeAuthorizedThread } from '../../middleware/guards';
import { getVotingWeight } from '../../services/stakeHelper';

export const CreateThreadReactionErrors = {
  ThreadArchived: 'Thread is archived',
};

export function CreateThreadReaction(): Command<
  typeof schemas.CreateThreadReaction
> {
  return {
    ...schemas.CreateThreadReaction,
    auth: [
      authThread({
        action: GatedActionEnum.CREATE_THREAD_REACTION,
      }),
      verifyReactionSignature,
      tiered({ upvotes: true }),
    ],
    body: async ({ payload, actor, context }) => {
      const { address, thread } = mustBeAuthorizedThread(actor, context);

      if (thread.archived_at)
        throw new InvalidState(CreateThreadReactionErrors.ThreadArchived);

      const calculated_voting_weight = await getVotingWeight(
        thread.topic_id!,
        address.address,
      );

      const user = await models.User.findOne({
        where: { id: actor.user.id },
        attributes: ['tier'],
      });
      mustExist('User', user);

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
              user_tier_at_creation: user.tier,
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
        thread_id: thread.id!,
      };
    },
  };
}
