import { InvalidState, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isCommunityAdminOrTopicMember } from '../middleware';
import { verifyReactionSignature } from '../middleware/canvas';
import { mustExist } from '../middleware/guards';
import { getVotingWeight } from '../services/stakeHelper';

export const CreateThreadReactionErrors = {
  ThreadArchived: 'Thread is archived',
};

export function CreateThreadReaction(): Command<
  typeof schemas.CreateThreadReaction
> {
  return {
    ...schemas.CreateThreadReaction,
    auth: [
      isCommunityAdminOrTopicMember(
        schemas.PermissionEnum.CREATE_THREAD_REACTION,
      ),
      verifyReactionSignature,
    ],
    body: async ({ actor, payload }) => {
      const thread = await models.Thread.findOne({
        where: { id: payload.thread_id },
      });
      if (!mustExist('Thread', thread)) return;
      if (thread.archived_at)
        throw new InvalidState(CreateThreadReactionErrors.ThreadArchived);

      const address = await models.Address.findOne({
        where: {
          user_id: actor.user.id,
          community_id: thread.community_id,
          address: actor.address,
        },
      });
      if (!mustExist('Community address', address)) return;

      const calculated_voting_weight = await getVotingWeight(
        thread.community_id,
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
              ...payload,
              address_id: address.id!,
              calculated_voting_weight,
            },
          });

          address.last_active = new Date();
          await address.save({ transaction });

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
