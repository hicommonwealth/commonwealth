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
import { findAllRoles } from '../../util/roles';
import validateTopicThreshold from '../../util/validateTopicThreshold';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { AppError } from '../../../../common-common/src/errors';
import { getThreadUrl } from '../../../shared/utils';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { TrackOptions } from '../server_analytics_methods/track';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
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

export async function __createThreadReaction({
  user,
  address,
  chain,
  reaction,
  threadId,
  canvasAction,
  canvasSession,
  canvasHash,
}: CreateThreadReactionOptions): Promise<CreateThreadReactionResult> {
  const thread = await this.models.Thread.findOne({
    where: { id: threadId },
  });

  if (!thread) {
    throw new Error(`${Errors.ThreadNotFound}: ${threadId}`);
  }

  // check address ban
  if (chain) {
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: chain.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new Error(`${Errors.BanError}: ${banError}`);
    }
  }

  // check balance (bypass for admin)
  if (
    chain &&
    (chain.type === ChainType.Token || chain.network === ChainNetwork.Ethereum)
  ) {
    const addressAdminRoles = await findAllRoles(
      this.models,
      { where: { address_id: address.id } },
      chain.id,
      ['admin']
    );
    const isGodMode = user.isAdmin;
    const hasAdminRole = addressAdminRoles.length > 0;
    if (!isGodMode && !hasAdminRole) {
      let canReact;
      try {
        canReact = await validateTopicThreshold(
          this.tokenBalanceCache,
          this.models,
          thread.topic_id,
          address.address
        );
      } catch (e) {
        throw new ServerError(Errors.BalanceCheckFailed, e);
      }

      if (!canReact) {
        throw new AppError(Errors.InsufficientTokenBalance);
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
    categoryId: NotificationCategories.NewReaction,
    objectId: `discussion_${thread.id}`,
    notificationData: {
      created_at: new Date(),
      thread_id: thread.id,
      root_title: thread.title,
      root_type: 'discussion',
      chain_id: finalReaction.chain,
      author_address: finalReaction.Address.address,
      author_chain: finalReaction.Address.chain,
    },
    webhookData: {
      user: finalReaction.Address.address,
      author_chain: finalReaction.Address.chain,
      url: getThreadUrl(thread),
      title: thread.title,
      chain: finalReaction.chain,
      body: '',
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
