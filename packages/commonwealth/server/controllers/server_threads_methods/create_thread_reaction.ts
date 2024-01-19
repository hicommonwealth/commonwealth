import { AppError } from '@hicommonwealth/adapters';
import { NotificationCategories } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommunityInstance,
  ReactionAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { getBalanceForAddress } from '../../util/getBalanceForAddress';
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
    allowGodMode: true,
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

  const contractAddress = ''; // TODO: get 1155 contract address
  const tokenId = 1; // TODO: get token ID
  const stakeBalance = await getBalanceForAddress(
    address.address,
    contractAddress,
    tokenId,
  );
  const stakeWeight = 5; // TODO: get stake weight from community.stakeWeight
  const calculatedVotingWeight = stakeBalance * stakeWeight;

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
  const [foundOrCreatedReaction, created] =
    await this.models.Reaction.findOrCreate({
      where: reactionWhere,
      defaults: reactionData,
      include: [this.models.Address],
    });

  const finalReaction = created
    ? await this.models.Reaction.findOne({
        where: reactionWhere,
        include: [this.models.Address],
      })
    : foundOrCreatedReaction;

  if (!finalReaction) {
    throw new AppError(Errors.FailedCreateReaction);
  }

  // build notification options
  const notificationOptions: EmitOptions = {
    notification: {
      categoryId: NotificationCategories.NewReaction,
      data: {
        created_at: new Date(),
        thread_id: thread.id,
        root_title: thread.title,
        root_type: 'discussion',
        chain_id: finalReaction.community_id,
        author_address: finalReaction.Address.address,
        author_chain: finalReaction.Address.community_id,
      },
    },
    excludeAddresses: [finalReaction.Address!.address],
  };

  // build analytics options
  const analyticsOptions: TrackOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
    community: community.id,
  };

  return [finalReaction.toJSON(), notificationOptions, analyticsOptions];
}
