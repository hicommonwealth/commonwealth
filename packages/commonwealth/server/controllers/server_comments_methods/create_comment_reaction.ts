import { ReactionAttributes } from '../../models/reaction';
import { findAllRoles } from '../../util/roles';
import validateTopicThreshold from '../../util/validateTopicThreshold';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { AppError } from '../../../../common-common/src/errors';
import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
} from '../../../../common-common/src/types';
import { getThreadUrl } from '../../../shared/utils';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { UserInstance } from '../../models/user';
import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { ServerCommentsController } from '../server_comments_controller';
import { TrackOptions } from '../server_analytics_methods/track';
import { EmitOptions } from '../server_notifications_methods/emit';

const Errors = {
  CommentNotFound: 'Comment not found',
  ThreadNotFoundForComment: 'Thread not found for comment',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  BalanceCheckFailed: 'Could not verify user token balance',
};

export type CreateCommentReactionOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  reaction: string;
  commentId: number;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
};

export type CreateCommentReactionResult = [
  ReactionAttributes,
  EmitOptions[],
  TrackOptions[]
];

export async function __createCommentReaction(
  this: ServerCommentsController,
  {
    user,
    address,
    chain,
    reaction,
    commentId,
    canvasAction,
    canvasSession,
    canvasHash,
  }: CreateCommentReactionOptions
): Promise<CreateCommentReactionResult> {
  const comment = await this.models.Comment.findOne({
    where: { id: commentId },
  });
  if (!comment) {
    throw new Error(`${Errors.CommentNotFound}: ${commentId}`);
  }

  const thread = await this.models.Thread.findOne({
    where: { id: comment.thread_id },
  });
  if (!thread) {
    throw new Error(`${Errors.ThreadNotFoundForComment}: ${commentId}`);
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
    comment_id: comment.id,
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
  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    categoryId: NotificationCategories.NewReaction,
    objectId: `comment-${comment.id}`,
    notificationData: {
      created_at: new Date(),
      thread_id: thread.id,
      comment_id: comment.id,
      comment_text: comment.text,
      root_title: thread.title,
      root_type: null, // What is this for?
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
      body: comment.text,
    },
    excludeAddresses: [finalReaction.Address.address],
  });

  // build analytics options
  const allAnalyticsOptions: TrackOptions[] = [];

  allAnalyticsOptions.push({
    event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
    community: chain.id,
    isCustomDomain: null,
  });

  return [finalReaction.toJSON(), allNotificationOptions, allAnalyticsOptions];
}
