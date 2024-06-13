import { AppError, ServerError } from '@hicommonwealth/core';
import {
  AddressInstance,
  ReactionAttributes,
  UserInstance,
  commonProtocol as commonProtocolService,
} from '@hicommonwealth/model';
import { PermissionEnum } from '@hicommonwealth/schemas';
import { NotificationCategories, commonProtocol } from '@hicommonwealth/shared';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { config } from '../../config';
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

  let calculatedVotingWeight: number | null = null;
  if (config.REACTION_WEIGHT_OVERRIDE) {
    calculatedVotingWeight = config.REACTION_WEIGHT_OVERRIDE;
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
      const node = await this.models.ChainNode.findByPk(
        community.chain_node_id,
      );
      const stakeBalances =
        await commonProtocolService.contractHelpers.getNamespaceBalance(
          // @ts-expect-error StrictNullChecks
          community.namespace_address,
          stake.stake_id,
          // @ts-expect-error StrictNullChecks
          node.eth_chain_id,
          [address.address],
          // @ts-expect-error StrictNullChecks
          node.url,
        );
      calculatedVotingWeight = commonProtocol.calculateVoteWeight(
        stakeBalances[address.address],
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
    // @ts-expect-error StrictNullChecks
    calculated_voting_weight: calculatedVotingWeight,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
  };

  const [finalReaction] = await this.models.Reaction.findOrCreate({
    where: reactionWhere,
    // @ts-expect-error StrictNullChecks
    defaults: reactionData,
  });
  // build notification options
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.NewReaction,
      data: {
        created_at: new Date(),
        // @ts-expect-error StrictNullChecks
        thread_id: thread.id,
        // @ts-expect-error StrictNullChecks
        comment_id: comment.id,
        comment_text: comment.text,
        root_title: thread.title,
        // @ts-expect-error StrictNullChecks
        root_type: null, // What is this for?
        community_id: thread.community_id,
        author_address: address.address,
        author_community_id: address.community_id,
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
