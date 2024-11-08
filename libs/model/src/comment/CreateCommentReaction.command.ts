import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { authComment } from '../middleware';
import { verifyReactionSignature } from '../middleware/canvas';
import { mustBeAuthorizedComment } from '../middleware/guards';
import { getVotingWeight } from '../services/stakeHelper';

export function CreateCommentReaction(): Command<
  typeof schemas.CreateCommentReaction
> {
  return {
    ...schemas.CreateCommentReaction,
    auth: [
      authComment({
        action: schemas.PermissionEnum.CREATE_COMMENT_REACTION,
      }),
      verifyReactionSignature,
    ],
    body: async ({ payload, actor, auth }) => {
      const { address, comment } = mustBeAuthorizedComment(actor, auth);
      const thread = comment.Thread!;

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
              comment_id: comment.id,
              reaction: payload.reaction,
            },
            defaults: {
              address_id: address.id!,
              comment_id: comment.id,
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
