import { uniqBy } from 'lodash';
import { Op, QueryTypes } from 'sequelize';
import moment from 'moment';

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
  ProposalType,
} from '../../../common-common/src/types';
import { findAllRoles, findOneRole } from '../util/roles';
import { UserInstance } from '../models/user';
import validateTopicThreshold from '../util/validateTopicThreshold';
import { NotificationOptions } from './server_notifications_controller';
import { getThreadUrl, renderQuillDeltaToText } from '../../shared/utils';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { AnalyticsOptions } from './server_analytics_controller';
import { buildPaginationSql } from '../util/queries';
import { CommentAttributes } from '../models/comment';
import { parseUserMentions } from '../util/parseUserMentions';

const Errors = {
  CommentNotFound: 'Comment not found',
  ThreadNotFoundForComment: 'Thread not found for comment',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  ParseMentionsFailed: 'Failed to parse mentions',
  NotOwned: 'Not owned by this user',
};

export const MIN_COMMENT_SEARCH_QUERY_LENGTH = 4;

/**
 * Data representing a comment search result
 */
export type SearchCommentResult = {
  id: number;
  title: string;
  text: string;
  proposalid: number;
  type: 'comment';
  address_id: number;
  address: string;
  address_chain: string;
  created_at: string;
  chain: string;
  rank: number;
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
   * @param chain - Chain of comment
   * @param reaction - Type of reaction
   * @param commentId - ID of the comment
   * @param canvasAction - Canvas metadata (optional)
   * @param canvasSession - Canvas metadata (optional)
   * @param canvasHash - Canvas metadata (optional)
   * @throws `CommentNotFound`, `ThreadNotFoundForComment`, `BanError`, `BalanceCheckFailed`
   * @returns Promise that resolves to `[ReactionAttributes, NotificationOptions[], AnalyticsOptions[]]`
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
  ): Promise<[ReactionAttributes, NotificationOptions[], AnalyticsOptions[]]>;

  /**
   * Returns an array of reactions for a comment
   *
   * @param commentId - ID of the comment
   * @returns Promise that resolves to array of reactions
   */
  getCommentReactions(commentId: number): Promise<ReactionAttributes[]>;

  /**
   * Returns an array of comment search results
   *
   * @param chain - Chain object
   * @param search - Search term
   * @param sort - Sort option (optional)
   * @param page - Page number (optional)
   * @param pageSize - Number of items per page (optional)
   * @returns Promise that resolves to array of search comment results
   */
  searchComments(
    chain: ChainInstance,
    search: string,
    sort?: string,
    page?: number,
    pageSize?: number
  ): Promise<SearchCommentResult[]>;

  /**
   * Updates a comment, returns the comment
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of comment
   * @param commentId - ID of the comment to update
   * @param commentBody - Text body of the comment, markdown or richtext
   * @param attachments - File attachments (optional)
   * @returns Promise that resolves to `[CommentAttributes, NotificationOptions[]]`
   */
  updateComment(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    commentId: number,
    commentBody: string,
    attachments: any
  ): Promise<[CommentAttributes, NotificationOptions[]]>;

  /**
   * Deletes a comment, returns nothing
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of comment
   * @param address - Address of the user
   * @param commentId - ID of the comment to delete
   */
  deleteComment(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    commentId: number
  ): Promise<void>;
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
  ): Promise<[ReactionAttributes, NotificationOptions[], AnalyticsOptions[]]> {
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
          throw new Error(Errors.InsufficientTokenBalance);
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
    const allNotificationOptions: NotificationOptions[] = [];

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
    const allAnalyticsOptions: AnalyticsOptions[] = [];

    allAnalyticsOptions.push({
      event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
      community: chain.id,
      isCustomDomain: null,
    });

    return [
      finalReaction.toJSON(),
      allNotificationOptions,
      allAnalyticsOptions,
    ];
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

  async searchComments(
    chain: ChainInstance,
    search: string,
    sort?: string,
    page?: number,
    pageSize?: number
  ): Promise<SearchCommentResult[]> {
    // sort by rank by default
    let sortOptions: {
      column: string;
      direction: 'ASC' | 'DESC';
    } = {
      column: 'rank',
      direction: 'DESC',
    };
    switch ((sort || '').toLowerCase()) {
      case 'newest':
        sortOptions = { column: '"Comments".created_at', direction: 'DESC' };
        break;
      case 'oldest':
        sortOptions = { column: '"Comments".created_at', direction: 'ASC' };
        break;
    }

    const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
      limit: pageSize || 10,
      page: page || 1,
      orderBy: sortOptions.column,
      orderDirection: sortOptions.direction,
    });

    const bind: {
      searchTerm?: string;
      chain?: string;
      limit?: number;
    } = {
      searchTerm: search,
      ...paginationBind,
    };
    if (chain) {
      bind.chain = chain.id;
    }

    const chainWhere = bind.chain ? '"Comments".chain = $chain AND' : '';

    const comments = await this.models.sequelize.query(
      `
    SELECT
        "Comments".id,
        "Threads".title,
        "Comments".text,
        "Comments".thread_id as proposalId,
        'comment' as type,
        "Addresses".id as address_id,
        "Addresses".address,
        "Addresses".chain as address_chain,
        "Comments".created_at,
        "Threads".chain,
        ts_rank_cd("Comments"._search, query) as rank
      FROM "Comments"
      JOIN "Threads" ON "Comments".thread_id = "Threads".id
      JOIN "Addresses" ON "Comments".address_id = "Addresses".id,
      websearch_to_tsquery('english', $searchTerm) as query
      WHERE
        ${chainWhere}
        "Comments".deleted_at IS NULL AND
        query @@ "Comments"._search
      ${paginationSort}
    `,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    );

    return comments as SearchCommentResult[];
  }

  async updateComment(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    commentId: number,
    commentBody: string,
    attachments?: any
  ): Promise<[CommentAttributes, NotificationOptions[]]> {
    // check if banned
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: chain.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new Error(`Ban error: ${banError}`);
    }

    const attachFiles = async () => {
      if (attachments && typeof attachments === 'string') {
        await this.models.Attachment.create({
          attachable: 'comment',
          attachment_id: commentId,
          url: attachments,
          description: 'image',
        });
      } else if (attachments) {
        await Promise.all(
          attachments.map((u) =>
            this.models.Attachment.create({
              attachable: 'comment',
              attachment_id: commentId,
              url: u,
              description: 'image',
            })
          )
        );
      }
    };

    const userOwnedAddressIds = (await user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const comment = await this.models.Comment.findOne({
      where: {
        id: commentId,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });

    const thread = await this.models.Thread.findOne({
      where: { id: comment.thread_id },
    });
    if (!thread) {
      throw new Error(Errors.ThreadNotFoundForComment);
    }

    let latestVersion;
    try {
      latestVersion = JSON.parse(comment.version_history[0]).body;
    } catch (e) {
      console.log(e);
    }
    // If new comment body text has been submitted, create another version history entry
    if (decodeURIComponent(commentBody) !== latestVersion) {
      const recentEdit = {
        timestamp: moment(),
        body: decodeURIComponent(commentBody),
      };
      const arr = comment.version_history;
      arr.unshift(JSON.stringify(recentEdit));
      comment.version_history = arr;
    }
    comment.text = commentBody;
    comment.plaintext = (() => {
      try {
        return renderQuillDeltaToText(
          JSON.parse(decodeURIComponent(commentBody))
        );
      } catch (e) {
        return decodeURIComponent(commentBody);
      }
    })();
    await comment.save();
    await attachFiles();
    const finalComment = await this.models.Comment.findOne({
      where: { id: comment.id },
      include: [this.models.Address, this.models.Attachment],
    });

    const cwUrl = getThreadUrl(thread, comment?.id);
    const root_title = thread.title || '';

    const allNotificationOptions: NotificationOptions[] = [];

    allNotificationOptions.push({
      categoryId: NotificationCategories.CommentEdit,
      objectId: '',
      notificationData: {
        created_at: new Date(),
        thread_id: comment.thread_id,
        root_title,
        root_type: ProposalType.Thread,
        comment_id: +finalComment.id,
        comment_text: finalComment.text,
        chain_id: finalComment.chain,
        author_address: finalComment.Address.address,
        author_chain: finalComment.Address.chain,
      },
      webhookData: {
        user: finalComment.Address.address,
        url: cwUrl,
        title: thread.title || '',
        chain: finalComment.chain,
      },
      excludeAddresses: [finalComment.Address.address],
    });

    let mentions;
    try {
      const previousDraftMentions = parseUserMentions(latestVersion);
      const currentDraftMentions = parseUserMentions(
        decodeURIComponent(commentBody)
      );
      mentions = currentDraftMentions.filter((addrArray) => {
        let alreadyExists = false;
        previousDraftMentions.forEach((addrArray_) => {
          if (
            addrArray[0] === addrArray_[0] &&
            addrArray[1] === addrArray_[1]
          ) {
            alreadyExists = true;
          }
        });
        return !alreadyExists;
      });
    } catch (e) {
      throw new Error(Errors.ParseMentionsFailed);
    }

    // grab mentions to notify tagged users
    let mentionedAddresses;
    if (mentions?.length > 0) {
      mentionedAddresses = await Promise.all(
        mentions.map(async (mention) => {
          const mentionedUser = await this.models.Address.findOne({
            where: {
              chain: mention[0],
              address: mention[1],
            },
            include: [this.models.User],
          });
          return mentionedUser;
        })
      );
      // filter null results
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }

    // notify mentioned users, given permissions are in place
    if (mentionedAddresses?.length > 0) {
      mentionedAddresses.forEach((mentionedAddress) => {
        if (!mentionedAddress.User) {
          return; // some Addresses may be missing users, e.g. if the user removed the address
        }
        allNotificationOptions.push({
          categoryId: NotificationCategories.NewMention,
          objectId: `user-${mentionedAddress.User.id}`,
          notificationData: {
            created_at: new Date(),
            thread_id: +comment.thread_id,
            root_title,
            root_type: ProposalType.Thread,
            comment_id: +finalComment.id,
            comment_text: finalComment.text,
            chain_id: finalComment.chain,
            author_address: finalComment.Address.address,
            author_chain: finalComment.Address.chain,
          },
          webhookData: null,
          excludeAddresses: [finalComment.Address.address],
        });
      });
    }

    // update address last active
    address.last_active = new Date();
    address.save();

    return [finalComment.toJSON(), allNotificationOptions];
  }

  async deleteComment(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    commentId: number
  ): Promise<void> {
    // check if author can delete post
    const [canInteract, error] = await this.banCache.checkBan({
      chain: chain.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new Error(`Ban error; ${error}`);
    }

    const userOwnedAddressIds = (await user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);

    // find comment, if owned by user
    let comment = await this.models.Comment.findOne({
      where: {
        id: commentId,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [this.models.Address],
    });

    // if not owned by user, check if is admin/mod
    if (!comment) {
      comment = await this.models.Comment.findOne({
        where: {
          id: commentId,
        },
        include: [this.models.Chain],
      });
      if (!comment) {
        throw new Error(Errors.CommentNotFound);
      }
      const requesterIsAdminOrMod = await findOneRole(
        this.models,
        { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
        comment?.Chain?.id,
        ['admin', 'moderator']
      );

      if (!requesterIsAdminOrMod && !user.isAdmin) {
        throw new Error(Errors.NotOwned);
      }
    }

    // find and delete all associated subscriptions
    await this.models.Subscription.destroy({
      where: {
        offchain_comment_id: comment.id,
      },
    });

    // actually delete
    await comment.destroy();
  }
}
