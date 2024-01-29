import { AppError } from '@hicommonwealth/adapters';
import { ValidChains } from '@hicommonwealth/chains';
import { NotificationCategories } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommunityInstance,
  ReactionAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { REACTION_WEIGHT_OVERRIDE } from 'server/config';
import { getNamespaceBalance } from 'server/util/commonProtocol/contractHelpers';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_methods/track';
import { EmitOptions } from '../server_notifications_methods/emit';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  ThreadArchived: 'Thread is archived',
  FailedCreateReaction: 'Failed to create reaction',
};

export type CreateThreadReactionOptions = {
  user: UserInstance;
  address: AddressInstance;
  community: CommunityInstance;
  reaction: string;
  threadId: number;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
};

export type CreateThreadReactionResult = [
  ReactionAttributes,
  EmitOptions,
  TrackOptions,
];

export async function __createThreadReaction(
  this: ServerThreadsController,
  {
    user,
    address,
    community,
    reaction,
    threadId,
    canvasAction,
    canvasSession,
    canvasHash,
  }: CreateThreadReactionOptions,
): Promise<CreateThreadReactionResult> {
  const thread = await this.models.Thread.findOne({
    where: { id: threadId },
  });

  if (!thread) {
    throw new AppError(`${Errors.ThreadNotFound}: ${threadId}`);
  }

  // check if thread is archived
  if (thread.archived_at) {
    throw new AppError(Errors.ThreadArchived);
  }

  // check address ban
  if (community) {
    const [canInteract, banError] = await this.banCache.checkBan({
      communityId: community.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new AppError(`${Errors.BanError}: ${banError}`);
    }
  }

  // check balance (bypass for admin)
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: community.id!,
    entity: thread,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    const { isValid, message } = await validateTopicGroupsMembership(
      this.models,
      this.tokenBalanceCache,
      thread.topic_id!,
      community,
      address,
    );
    if (!isValid) {
      throw new AppError(`${Errors.FailedCreateReaction}: ${message}`);
    }
  }

  let calculatedVotingWeight: number | null = null;
  if (REACTION_WEIGHT_OVERRIDE) {
    calculatedVotingWeight = REACTION_WEIGHT_OVERRIDE;
  } else {
    // calculate voting weight
    const stake = await this.models.CommunityStake.findOne({
      where: { community_id: community.id },
    });
    if (stake) {
      const vote_weight = stake.vote_weight;
      const stakeBalance = await getNamespaceBalance(
        this.tokenBalanceCache,
        community.namespace,
        stake.stake_id,
        ValidChains.Goerli,
        address.address,
        this.models,
      );
      calculatedVotingWeight = parseInt(stakeBalance, 10) * vote_weight;
    }
  }

  // create the reaction
  const reactionWhere: Partial<ReactionAttributes> = {
    reaction,
    address_id: address.id,
    community_id: community.id,
    thread_id: thread.id,
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
  const notificationOptions: EmitOptions = {
    notification: {
      categoryId: NotificationCategories.NewReaction,
      data: {
        created_at: new Date(),
        thread_id: thread.id,
        root_title: thread.title,
        root_type: 'discussion',
        chain_id: community.id,
        author_address: address.address,
        author_chain: address.community_id,
      },
    },
    excludeAddresses: [address.address],
  };

  // build analytics options
  const analyticsOptions: TrackOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
    community: community.id,
  };

  const finalReactionWithAddress: ReactionAttributes = {
    ...finalReaction.toJSON(),
    Address: address,
  };

  return [finalReactionWithAddress, notificationOptions, analyticsOptions];
}
