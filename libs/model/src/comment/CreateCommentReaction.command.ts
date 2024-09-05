import { type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../database';
import { isCommunityAdminOrTopicMember } from '../middleware';
import { verifyReactionSignature } from '../middleware/canvas';
import { mustExist } from '../middleware/guards';

export const CreateCommentReactionErrors = {
  // CommentNotFound: 'Comment not found',
  // ThreadNotFoundForComment: 'Thread not found for comment',
  // BanError: 'Ban error',
  // InsufficientTokenBalance: 'Insufficient token balance',
  // BalanceCheckFailed: 'Could not verify user token balance',
  // FailedCreateReaction: 'Failed to create reaction',
  // CommunityNotFound: 'Community not found',
  // MustHaveStake: 'Must have stake to upvote',
};

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
      const { comment_id } = payload;
      const comment = await models.Comment.findOne({
        where: { id: comment_id },
        include: [models.Thread],
      });
      if (!mustExist('Comment', comment)) return;

      const address = await models.Address.findOne({
        where: {
          community_id: comment.Thread?.community_id,
          user_id: actor.user.id,
          address: actor.address,
        },
      });
      if (!mustExist('Community address', address)) return;

      // == mutation transaction boundary ==
      const new_reaction_id = await models.sequelize.transaction(
        async (transaction) => {
          // update timestamps
          address.last_active = new Date();
          await address.save({ transaction });

          return 1;
        },
      );
      // == end of transaction boundary ==

      const reaction = await models.Reaction.findOne({
        where: { id: new_reaction_id! },
        include: [{ model: models.Address, include: [models.User] }],
      });
      return {
        ...reaction!.toJSON(),
        community_id: comment.Thread?.community_id,
      };
    },
  };
}

/*
import {
  AddressInstance,
  ReactionAttributes,
  UserInstance,
  stakeHelper,
} from '@hicommonwealth/model';
import { PermissionEnum } from '@hicommonwealth/schemas';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { findAllRoles } from '../../util/roles';
import { TrackOptions } from '../server_analytics_controller';
import { ServerCommentsController } from '../server_comments_controller';

 
 
  const comment = await this.models.Comment.findOne({
    where: { id: commentId },
    include: [
      {
        model: this.models.Thread,
        required: true,
      },
    ],
  });
  if (!comment) {
    throw new AppError(`${Errors.CommentNotFound}: ${commentId}`);
  }
  const { Thread: thread } = comment;
  if (!thread) {
    throw new AppError(Errors.ThreadNotFoundForComment);
  }

  if (address.is_banned) throw new AppError('Banned User');

  // check balance (bypass for admin)
  const addressAdminRoles = await findAllRoles(
    this.models,
    { where: { address_id: address.id! } },
    thread.community_id,
    ['admin'],
  );
  const isSuperAdmin = user.isAdmin;
  const hasAdminRole = addressAdminRoles.length > 0;
  if (!isSuperAdmin && !hasAdminRole) {
    let canReact = false;
    try {
      const { isValid } = await validateTopicGroupsMembership(
        this.models,
        // @ts-expect-error StrictNullChecks
        thread.topic_id,
        thread.community_id,
        address,
        PermissionEnum.CREATE_COMMENT_REACTION,
      );
      canReact = isValid;
    } catch (e) {
      throw new ServerError(`${Errors.BalanceCheckFailed}: ${e.message}`);
    }
    if (!canReact) {
      throw new AppError(Errors.InsufficientTokenBalance);
    }
  }

  // create the reaction
  const reactionWhere: Partial<ReactionAttributes> = {
    reaction,
    address_id: address.id,
    comment_id: comment.id!,
  };
  const reactionData: Partial<ReactionAttributes> = {
    ...reactionWhere,
    calculated_voting_weight: await stakeHelper.getVotingWeight(
      thread.community_id,
      address.address,
    ),
    canvas_hash: canvasHash,
    canvas_signed_data: canvasSignedData,
  };

  const [finalReaction] = await this.models.Reaction.findOrCreate({
    where: reactionWhere,
    defaults: reactionData,
  });
 

  allAnalyticsOptions.push({
    event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
    community: thread.community_id,
    userId: user.id,
  });

  // update address last active
  address.last_active = new Date();
  address.save().catch(console.error);

  const finalReactionWithAddress: ReactionAttributes = {
    ...finalReaction.toJSON(),
    Address: address,
  };

 
*/
