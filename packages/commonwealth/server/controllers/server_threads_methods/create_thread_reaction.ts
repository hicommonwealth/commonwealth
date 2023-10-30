import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { ReactionAttributes } from '../../models/reaction';
import { UserInstance } from '../../models/user';
import { EmitOptions } from '../server_notifications_methods/emit';
import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
} from '../../../../common-common/src/types';
import { AppError } from '../../../../common-common/src/errors';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { TrackOptions } from '../server_analytics_methods/track';
import { ServerThreadsController } from '../server_threads_controller';
import { validateOwner } from '../../util/validateOwner';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';

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
  chain: ChainInstance;
  reaction: string;
  threadId: number;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
};

export type CreateThreadReactionResult = [
  ReactionAttributes,
  EmitOptions,
  TrackOptions
];

export async function __createThreadReaction(
  this: ServerThreadsController,
  {
    user,
    address,
    chain,
    reaction,
    threadId,
    canvasAction,
    canvasSession,
    canvasHash,
  }: CreateThreadReactionOptions
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
  if (chain) {
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: chain.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new AppError(`${Errors.BanError}: ${banError}`);
    }
  }

  // check balance (bypass for admin)
  if (
    chain &&
    (chain.type === ChainType.Token || chain.network === ChainNetwork.Ethereum)
  ) {
    const isAdmin = await validateOwner({
      models: this.models,
      user,
      chainId: chain.id,
      entity: thread,
      allowAdmin: true,
      allowGodMode: true,
    });
    if (!isAdmin) {
      const { isValid, message } = await validateTopicGroupsMembership(
        this.models,
        this.tokenBalanceCache,
        thread.topic_id,
        chain,
        address
      );
      if (!isValid) {
        throw new AppError(`${Errors.FailedCreateReaction}: ${message}`);
      }
    }
  }

  // create the reaction
  const reactionData: ReactionAttributes = {
    reaction,
    address_id: address.id,
    chain: chain.id,
    thread_id: thread.id,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
  };
  const [foundOrCreatedReaction, created] =
    await this.models.Reaction.findOrCreate({
      where: reactionData,
      defaults: reactionData,
      include: [this.models.Address],
    });

  const finalReaction = created
    ? await this.models.Reaction.findOne({
        where: reactionData,
        include: [this.models.Address],
      })
    : foundOrCreatedReaction;

  // build notification options
  const notificationOptions: EmitOptions = {
    notification: {
      categoryId: NotificationCategories.NewReaction,
      data: {
        created_at: new Date(),
        thread_id: thread.id,
        root_title: thread.title,
        root_type: 'discussion',
        chain_id: finalReaction.chain,
        author_address: finalReaction.Address.address,
        author_chain: finalReaction.Address.community_id,
      },
    },
    excludeAddresses: [finalReaction.Address.address],
  };

  // build analytics options
  const analyticsOptions: TrackOptions = {
    event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
    community: chain.id,
    isCustomDomain: null,
  };

  return [finalReaction.toJSON(), notificationOptions, analyticsOptions];
}
