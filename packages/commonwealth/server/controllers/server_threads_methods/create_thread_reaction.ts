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
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_controller';
import { EmitOptions } from '../server_notifications_methods/emit';
import { ServerThreadsController } from '../server_threads_controller';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
  ThreadArchived: 'Thread is archived',
  FailedCreateReaction: 'Failed to create reaction',
  CommunityNotFound: 'Community not found',
};

export type CreateThreadReactionOptions = {
  user: UserInstance;
  address: AddressInstance;
  reaction: string;
  threadId: number;
  canvasSignedData?: string;
  canvasHash?: string;
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
    reaction,
    threadId,
    canvasSignedData,
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
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: thread.community_id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`${Errors.BanError}: ${banError}`);
  }

  // check balance (bypass for admin)
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: thread.community_id,
    entity: thread,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    const { isValid, message } = await validateTopicGroupsMembership(
      this.models,
      // @ts-expect-error StrictNullChecks
      thread.topic_id,
      thread.community_id,
      address,
      PermissionEnum.CREATE_THREAD_REACTION,
    );
    if (!isValid) {
      throw new AppError(`${Errors.FailedCreateReaction}: ${message}`);
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

      if (!node || !node.eth_chain_id) {
        throw new ServerError(`Invalid chain node ${node ? node.id : ''}`);
      }
      const stakeBalances =
        await commonProtocolService.contractHelpers.getNamespaceBalance(
          community.namespace_address!,
          stake.stake_id,
          node.eth_chain_id,
          [address.address],
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
    // @ts-expect-error StrictNullChecks
    thread_id: thread.id,
  };
  const reactionData: Partial<ReactionAttributes> = {
    ...reactionWhere,
    // @ts-expect-error StrictNullChecks
    calculated_voting_weight: calculatedVotingWeight,
    canvas_signed_data: canvasSignedData,
    canvas_hash: canvasHash,
  };

  const [finalReaction] = await this.models.Reaction.findOrCreate({
    where: reactionWhere,
    // @ts-expect-error StrictNullChecks
    defaults: reactionData,
  });

  // build notification options
  const notificationOptions: EmitOptions = {
    notification: {
      categoryId: NotificationCategories.NewReaction,
      data: {
        created_at: new Date(),
        // @ts-expect-error StrictNullChecks
        thread_id: thread.id,
        root_title: thread.title,
        root_type: 'discussion',
        community_id: thread.community_id,
        author_address: address.address,
        author_community_id: address.community_id,
      },
    },
    excludeAddresses: [address.address],
  };

  // build analytics options
  const analyticsOptions: TrackOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
    community: thread.community_id,
  };

  const finalReactionWithAddress: ReactionAttributes = {
    ...finalReaction.toJSON(),
    Address: address,
  };

  return [finalReactionWithAddress, notificationOptions, analyticsOptions];
}
