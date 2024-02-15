import {
  AppError,
  NotificationCategories,
  ServerError,
  commonProtocol,
} from '@hicommonwealth/core';
import {
  AddressInstance,
  ReactionAttributes,
  UserInstance,
  commonProtocol as commonProtocolService,
} from '@hicommonwealth/model';
import { REACTION_WEIGHT_OVERRIDE } from 'server/config';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { findAllRoles } from '../../util/roles';
import { TrackOptions } from '../server_analytics_controller';
import { ServerCommentsController } from '../server_comments_controller';
import { EmitOptions } from '../server_notifications_methods/emit';

const Errors = {
  CommentNotFound: 'Comment not found',
  ThreadNotFoundForComment: 'Thread not found for comment',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  FailedCreateReaction: 'Failed to create reaction',
  CommunityNotFound: 'Community not found',
};

export type CreateCommentReactionOptions = {
  user: UserInstance;
  address: AddressInstance;
  reaction: string;
  commentId: number;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
};

export type CreateCommentReactionResult = [
  ReactionAttributes,
  EmitOptions[],
  TrackOptions[],
];

export async function __createCommentReaction(
  this: ServerCommentsController,
  {
    user,
    address,
    reaction,
    commentId,
    canvasAction,
    canvasSession,
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

  // check address ban
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: thread.community_id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`${Errors.BanError}: ${banError}`);
  }

  // check balance (bypass for admin)
  const addressAdminRoles = await findAllRoles(
    this.models,
    { where: { address_id: address.id } },
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
        thread.topic_id,
        thread.community_id,
        address,
      );
      canReact = isValid;
    } catch (e) {
      throw new ServerError(`${Errors.BalanceCheckFailed}: ${e.message}`);
    }
    if (!canReact) {
      throw new AppError(Errors.InsufficientTokenBalance);
    }
  }

  let calculatedVotingWeight: number | null = null;
  if (REACTION_WEIGHT_OVERRIDE) {
    calculatedVotingWeight = REACTION_WEIGHT_OVERRIDE;
  } else {
    // calculate voting weight
    const stake = await this.models.CommunityStake.findOne({
      where: { community_id: thread.community_id },
    });
    if (stake) {
      const voteWeight = stake.vote_weight;
      const community = await this.models.Community.findByPk(
        thread.community_id,
      );
      if (!community) {
        throw new AppError(Errors.CommunityNotFound);
      }
      const stakeBalance =
        await commonProtocolService.contractHelpers.getNamespaceBalance(
          community.namespace,
          stake.stake_id,
          commonProtocol.ValidChains.Sepolia,
          address.address,
          this.models,
        );
      calculatedVotingWeight = commonProtocol.calculateVoteWeight(
        stakeBalance,
        voteWeight,
      );
    }
  }

  // create the reaction
  const reactionWhere: Partial<ReactionAttributes> = {
    reaction,
    address_id: address.id,
    community_id: thread.community_id,
    comment_id: comment.id,
  };
  const reactionData: Partial<ReactionAttributes> = {
    ...reactionWhere,
    calculated_voting_weight: calculatedVotingWeight,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
  };

  const [finalReaction] = await this.models.Reaction.findOrCreate({
    where: reactionWhere,
    defaults: reactionData,
  });
  // build notification options
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.NewReaction,
      data: {
        created_at: new Date(),
        thread_id: thread.id,
        comment_id: comment.id,
        comment_text: comment.text,
        root_title: thread.title,
        root_type: null, // What is this for?
        chain_id: thread.community_id,
        author_address: address.address,
        author_chain: address.community_id,
      },
    },
    excludeAddresses: [address.address],
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

  return [
    finalReactionWithAddress,
    allNotificationOptions,
    allAnalyticsOptions,
  ];
}
