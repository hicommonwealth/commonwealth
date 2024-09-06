import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isCommunityAdminOrTopicMember } from '../middleware';
import { verifyReactionSignature } from '../middleware/canvas';
import { mustExist } from '../middleware/guards';
import { getVotingWeight } from '../services/stakeHelper';

export function CreateCommentReaction(): Command<
  typeof schemas.CreateCommentReaction
> {
  return {
    ...schemas.CreateCommentReaction,
    auth: [
      isCommunityAdminOrTopicMember(
        schemas.PermissionEnum.CREATE_COMMENT_REACTION,
      ),
      verifyReactionSignature,
    ],
    body: async ({ actor, payload }) => {
      const comment = await models.Comment.findOne({
        where: { id: payload.comment_id },
        include: [
          {
            model: models.Thread,
            required: true,
          },
        ],
      });
      if (!mustExist('Comment', comment)) return;

      const thread = comment.Thread!;
      const address = await models.Address.findOne({
        where: {
          community_id: thread.community_id,
          user_id: actor.user.id,
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
              comment_id: comment.id,
              reaction: payload.reaction,
            },
            defaults: {
              address_id: address.id!,
              comment_id: comment.id,
              reaction: payload.reaction,
              calculated_voting_weight,
              canvas_hash: payload.canvas_hash,
              canvas_signed_data: payload.canvas_signed_data,
            },
            transaction,
          });

          address.last_active = new Date();
          await address.save({ transaction });

          return reaction.id;
        },
      );
      // == end of transaction boundary ==

      const reaction = await models.Reaction.findOne({
        where: { id: new_reaction_id! },
        include: [{ model: models.Address, include: [models.User] }],
      });
      return {
        ...reaction!.toJSON(),
        community_id: thread.community_id,
      };
    },
  };
}
