import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { ReactionAttributes } from '../models/reaction';
import { TokenBalanceCache } from '../../../token-balance-cache/src';
import { ChainInstance } from '../models/chain';
import { AddressInstance } from '../models/address';
import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
} from '../../../common-common/src/types';
import { findAllRoles } from '../util/roles';
import { UserInstance } from '../models/user';
import validateTopicThreshold from '../util/validateTopicThreshold';
import { NotificationOptions } from './server_notifications_controller';
import { getThreadUrl } from '../../shared/utils';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { AnalyticsOptions } from './server_analytics_controller';
import { uniqBy } from 'lodash';

const Errors = {
  CommentNotFound: 'Comment not found',
  ThreadNotFoundForComment: 'Thread not found for comment',
  RuleCheckFailed: 'Rule check failed',
  BanError: 'Ban error',
  BalanceCheckFailed: 'Could not verify user token balance',
};

/**
 * An interface that describes the methods related to comments
 */
interface IServerCommentsController {
  /**
   * Creates a reaction for a comment, returns reaction
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of thread
   * @param reaction - Type of reaction
   * @param commentId - ID of the comment
   * @param canvasAction - Canvas metadata
   * @param canvasSession - Canvas metadata
   * @param canvasHash - Canvas metadata
   * @throws `CommentNotFound`, `RuleCheckFailed`, `BanError`, `BalanceCheckFailed`
   * @returns Promise that resolves to [Reaction, NotificationOptions, AnalyticsOptions]
   */
  createCommentReaction(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    reaction: string,
    commentId: number,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ReactionAttributes, NotificationOptions, AnalyticsOptions]>;

  /**
   * Returns an array of reactions for a comment
   *
   * @param commentId - ID of the comment
   * @returns Promise that resolves to array of reactions
   */
  getCommentReactions(commentId: number): Promise<ReactionAttributes[]>;
}

/**
 * Implements methods related to comments
 */
export class ServerCommentsController implements IServerCommentsController {
  constructor(
    private models: DB,
    private tokenBalanceCache: TokenBalanceCache,
    private banCache: BanCache
  ) {}

  async createCommentReaction(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    reaction: string,
    commentId: number,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ReactionAttributes, NotificationOptions, AnalyticsOptions]> {
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

    // check permissions (bypass for admin)
    if (
      chain &&
      (chain.type === ChainType.Token ||
        chain.network === ChainNetwork.Ethereum)
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
        const canReact = await validateTopicThreshold(
          this.tokenBalanceCache,
          this.models,
          thread.topic_id,
          address.address
        );
        if (!canReact) {
          throw new Error(Errors.BalanceCheckFailed);
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
    const notificationOptions: NotificationOptions = {
      categoryId: NotificationCategories.NewReaction,
      objectId: `comment-${comment.id}`,
      notificationData: {
        created_at: new Date(),
        thread_id: thread.id,
        comment_id: comment.id,
        comment_text: comment.text,
        root_title: thread.title,
        root_type: null,
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
    };

    // build analytics options
    const analyticsOptions = {
      event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
      community: chain.id,
      isCustomDomain: null,
    };

    return [finalReaction.toJSON(), notificationOptions, analyticsOptions];
  }

  async getCommentReactions(commentId: number): Promise<ReactionAttributes[]> {
    const reactions = await this.models.Reaction.findAll({
      where: {
        comment_id: commentId,
      },
      include: [this.models.Address],
      order: [['created_at', 'DESC']],
    });
    return uniqBy(
      reactions.map((c) => c.toJSON()),
      'id'
    );
  }
}
