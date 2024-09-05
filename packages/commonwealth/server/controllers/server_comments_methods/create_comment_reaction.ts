import { AppError, ServerError } from '@hicommonwealth/core';
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

const Errors = {
  CommentNotFound: 'Comment not found',
  ThreadNotFoundForComment: 'Thread not found for comment',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  FailedCreateReaction: 'Failed to create reaction',
  CommunityNotFound: 'Community not found',
  MustHaveStake: 'Must have stake to upvote',
};

export type CreateCommentReactionOptions = {
  user: UserInstance;
  address: AddressInstance;
  reaction: 'like';
  commentId: number;
  canvasSignedData?: string;
  canvasHash?: string;
};

export type CreateCommentReactionResult = [ReactionAttributes, TrackOptions[]];

export async function __createCommentReaction(
  this: ServerCommentsController,
  {
    user,
    address,
    reaction,
    commentId,
    canvasSignedData,
    canvasHash,
  }: CreateCommentReactionOptions,
): Promise<CreateCommentReactionResult> {
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
    // @ts-expect-error StrictNullChecks
    defaults: reactionData,
  });

  // build analytics options
  const allAnalyticsOptions: TrackOptions[] = [];

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

  return [finalReactionWithAddress, allAnalyticsOptions];
}
