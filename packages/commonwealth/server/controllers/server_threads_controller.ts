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
import {
  getThreadUrl,
  renderQuillDeltaToText,
  validURL,
} from '../../shared/utils';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { AnalyticsOptions } from './server_analytics_controller';
import { CommentAttributes, CommentInstance } from '../models/comment';
import { getCommentDepth } from '../util/getCommentDepth';
import { parseUserMentions } from '../util/parseUserMentions';
import deleteThreadFromDb from '../util/deleteThread';
import { Link, ThreadAttributes, ThreadInstance } from '../models/thread';
import { Op, QueryTypes } from 'sequelize';
import getThreadsWithCommentCount from '../util/getThreadCommentsCount';
import { PaginationSqlBind, buildPaginationSql } from '../util/queries';
import { getLastEdited } from '../util/getLastEdited';
import { AppError, ServerError } from 'common-common/src/errors';

export const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  InvalidParent: 'Invalid parent',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',
  BalanceCheckFailed: 'Could not verify user token balance',

  NotOwned: 'Not owned by this user',

  NoThreadId: 'Must provide thread_id',
  NoBodyOrAttachment: 'Must provide body or attachment',
  IncorrectOwner: 'Not owned by this user',
  InvalidLink: 'Invalid thread URL',

  ParseMentionsFailed: 'Failed to parse mentions',

  NoBodyOrAttachments: 'Discussion posts must include body or attachment',
  LinkMissingTitleOrUrl: 'Links must include a title and URL',
  UnsupportedKind: 'Only discussion and link posts supported',
  FailedCreateThread: 'Failed to create thread',
  DiscussionMissingTitle: 'Discussion posts must include a title',
};

const MAX_COMMENT_DEPTH = 8; // Sets the maximum depth of comments
const MIN_THREADS_PER_TOPIC = 0;
const MAX_THREADS_PER_TOPIC = 10;

/**
 * An interface that describes the methods related to threads
 */
interface IServerThreadsController {
  /**
   * Creates a reaction for a thread, returns reaction
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of thread
   * @param reaction - Type of reaction
   * @param threadId - ID of the thread
   * @param canvasAction - Canvas metadata (optional)
   * @param canvasSession - Canvas metadata (optional)
   * @param canvasHash - Canvas metadata (optional)
   * @throws
   * @returns Promise that resolves to [Reaction, NotificationOptions, AnalyticsOptions]
   */
  createThreadReaction(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    reaction: string,
    threadId: number,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ReactionAttributes, NotificationOptions, AnalyticsOptions]>;

  /**
   * Creates a comment for a thread, returns comment
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of thread
   * @param parentId - ID of parent comment (if new comment is a reply)
   * @param threadId - ID of thread
   * @param text - Chain of thread
   * @param attachments - File attachments
   * @param canvasAction - Canvas metadata (optional)
   * @param canvasSession - Canvas metadata (optional)
   * @param canvasHash - Canvas metadata (optional)
   * @throws
   * @returns Promise that resolves to [Comment, NotificationOptions[], AnalyticsOptions]
   */
  createThreadComment(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    parentId: number,
    threadId: number,
    text: string,
    attachments: any,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[CommentAttributes, NotificationOptions[], AnalyticsOptions]>;

  /**
   * Deletes a thread
   *
   * @param user - Current user
   * @param threadId - ID of thread
   * @throws
   * @returns Promise that resolves to nothing
   */
  deleteThread(user: UserInstance, threadId: number): Promise<void>;

  /**
   * Updates a thread
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of thread
   * @param threadId - ID of thread
   * @param title - Title of the thread (optional)
   * @param body - Body text of the thread (optional)
   * @param stage - Stage of thread (optional)
   * @param url - URL of the thread (optional)
   * @param attachment - Attachments (optional)
   * @param canvasAction - Canvas metadata (optional)
   * @param canvasSession - Canvas metadata (optional)
   * @param canvasHash - Canvas metadata (optional)
   * @throws
   * @returns Promise that resolves to nothing
   */
  updateThread(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    threadId: number,
    title?: string,
    body?: string,
    stage?: string,
    url?: string,
    attachments?: any,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ThreadAttributes, NotificationOptions[]]>;

  /**
   * Creates a thread
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of thread
   * @param title - Title of the thread
   * @param body - Body text of the thread
   * @param kind - Kind the thread
   * @param readOnly - Kind the thread
   * @param topicId - ID of thread topic (optional)
   * @param topicName - Name of thread topic (if topicID not specified) (optional)
   * @param stage - Stage of thread (optional)
   * @param url - URL of the thread (optional)
   * @param attachments - Attachments (optional)
   * @param canvasAction - Canvas metadata (optional)
   * @param canvasSession - Canvas metadata (optional)
   * @param canvasHash - Canvas metadata (optional)
   * @throws
   * @returns Promise that resolves to nothing
   */
  createThread(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    title: string,
    body: string,
    kind: string,
    readOnly: boolean,
    topicId?: number,
    topicName?: string,
    stage?: string,
    url?: string,
    attachments?: any,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ThreadAttributes, NotificationOptions[], AnalyticsOptions]>;

  /**
   * Returns threads by ID
   *
   * @param threadIds - Array of IDs of threads
   * @throws
   * @returns Promise that resolves to array of threads
   */
  getThreadsByIds(threadIds: number[]): Promise<ThreadAttributes[]>;

  /**
   * Returns threads for each topic on the specified chain
   *
   * @param chain - Chain of thread
   * @param threadsPerTopic - Number of threads per topic
   * @returns Promise that resolves to array of threads
   */
  getActiveThreads(
    chain: ChainInstance,
    threadsPerTopic: number
  ): Promise<ThreadAttributes[]>;

  /**
   * Returns threads by chain and search term
   *
   * @param chain - Chain of thread
   * @param searchTerm - Search term
   * @param threadTitleOnly - Only return titles of threads
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @returns Promise that resolves to array of threads
   */
  searchThreads(
    chain: ChainInstance,
    searchTerm: string,
    threadTitleOnly: boolean,
    sort: string,
    page: number,
    pageSize: number
  ): Promise<ThreadAttributes[]>;

  /**
   * Returns most recent N threads before cutoff
   *
   * @param chain - Chain of thread
   * @param stage - Stage of thread
   * @param topicId - ID of topic
   * @param includePinnedThreads - Whether to include pinned threads or not
   * @param page - Page number
   * @param limit - Number of items per page
   * @param orderBy - Column to sort by
   * @param fromDate - Start date
   * @param toDate - End date
   * @returns Promise that resolves to object containing threads and results metadata
   */
  getBulkThreads(
    chain: ChainInstance,
    stage: string,
    topicId: number,
    includePinnedThreads: boolean,
    page: number,
    limit: number,
    orderBy: string,
    fromDate: string,
    toDate: string
  ): Promise<{
    numVotingThreads: number;
    threads: ThreadAttributes[];
    limit: number;
    page: number;
  }>;
}

/**
 * Implements methods related to threads
 */
export class ServerThreadsController implements IServerThreadsController {
  constructor(
    private models: DB,
    private tokenBalanceCache: TokenBalanceCache,
    private banCache: BanCache
  ) {}

  async createThreadReaction(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    reaction: string,
    threadId: number,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ReactionAttributes, NotificationOptions, AnalyticsOptions]> {
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
    const notificationOptions: NotificationOptions = {
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
    const analyticsOptions = {
      event: MixpanelCommunityInteractionEvent.CREATE_REACTION,
      community: chain.id,
      isCustomDomain: null,
    };

    return [finalReaction.toJSON(), notificationOptions, analyticsOptions];
  }

  async createThreadComment(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    parentId: number,
    threadId: number,
    text: string,
    attachments: any,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[CommentAttributes, NotificationOptions[], AnalyticsOptions]> {
    // check if banned
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: chain.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new Error(`${Errors.BanError}: ${banError}`);
    }

    // check if thread exists
    const thread = await this.models.Thread.findOne({
      where: { id: threadId },
    });
    if (!thread) {
      throw new Error(Errors.ThreadNotFound);
    }

    // check if thread is read-only
    if (thread.read_only) {
      throw new Error(Errors.CantCommentOnReadOnly);
    }

    // get parent comment
    let parentComment;
    if (parentId) {
      // check that parent comment is in the same community
      parentComment = await this.models.Comment.findOne({
        where: {
          id: parentId,
          chain: chain.id,
        },
      });
      if (!parentComment) {
        throw new Error(Errors.InvalidParent);
      }
      // check to ensure comments are never nested more than max depth:
      const [commentDepthExceeded] = await getCommentDepth(
        this.models,
        parentComment,
        MAX_COMMENT_DEPTH
      );
      if (commentDepthExceeded) {
        throw new Error(Errors.NestingTooDeep);
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

    const plaintext = (() => {
      try {
        return renderQuillDeltaToText(JSON.parse(decodeURIComponent(text)));
      } catch (e) {
        return decodeURIComponent(text);
      }
    })();

    // New comments get an empty version history initialized, which is passed
    // the comment's first version, formatted on the backend with timestamps
    const firstVersion = {
      timestamp: moment(),
      body: decodeURIComponent(text),
    };
    const version_history: string[] = [JSON.stringify(firstVersion)];
    const commentContent = {
      thread_id: `${threadId}`,
      text,
      plaintext,
      version_history,
      address_id: address.id,
      chain: chain.id,
      parent_id: null,
      canvas_action: canvasAction,
      canvas_session: canvasSession,
      canvas_hash: canvasHash,
    };
    if (parentId) {
      Object.assign(commentContent, { parent_id: parentId });
    }

    // create comment and attachments in transaction

    const transaction = await this.models.sequelize.transaction();

    let comment: CommentInstance | null = null;
    try {
      comment = await this.models.Comment.create(commentContent, {
        transaction,
      });

      // TODO: attachments can likely be handled like mentions (see lines 10 & 11)
      if (attachments) {
        if (typeof attachments === 'string') {
          await this.models.Attachment.create(
            {
              attachable: 'comment',
              attachment_id: comment.id,
              url: attachments,
              description: 'image',
            },
            { transaction }
          );
        } else {
          await Promise.all(
            attachments.map((url) =>
              this.models.Attachment.create(
                {
                  attachable: 'comment',
                  attachment_id: comment.id,
                  url,
                  description: 'image',
                },
                { transaction }
              )
            )
          );
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    // fetch attached objects to return to user
    const finalComment = await this.models.Comment.findOne({
      where: { id: comment.id },
      include: [this.models.Address, this.models.Attachment],
    });

    const subsTransaction = await this.models.sequelize.transaction();
    try {
      // auto-subscribe comment author to reactions & child comments
      await this.models.Subscription.create(
        {
          subscriber_id: user.id,
          category_id: NotificationCategories.NewReaction,
          object_id: `comment-${finalComment.id}`,
          chain_id: finalComment.chain || null,
          comment_id: finalComment.id,
          is_active: true,
        },
        { transaction: subsTransaction }
      );
      await this.models.Subscription.create(
        {
          subscriber_id: user.id,
          category_id: NotificationCategories.NewComment,
          object_id: `comment-${finalComment.id}`,
          chain_id: finalComment.chain || null,
          comment_id: finalComment.id,
          is_active: true,
        },
        { transaction: subsTransaction }
      );

      await subsTransaction.commit();
    } catch (err) {
      await subsTransaction.rollback();
      await finalComment.destroy();
      throw err;
    }

    // grab mentions to notify tagged users
    const bodyText = decodeURIComponent(text);
    let mentionedAddresses;
    try {
      const mentions = parseUserMentions(bodyText);
      if (mentions && mentions.length > 0) {
        mentionedAddresses = await Promise.all(
          mentions.map(async (mention) => {
            const mentionedUser = await this.models.Address.findOne({
              where: {
                chain: mention[0] || null,
                address: mention[1],
              },
              include: [this.models.User],
            });
            return mentionedUser;
          })
        );
        mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
      }
    } catch (e) {
      throw new Error('Failed to parse mentions');
    }

    const excludedAddrs = (mentionedAddresses || []).map(
      (addr) => addr.address
    );
    excludedAddrs.push(finalComment.Address.address);

    const cwUrl = getThreadUrl(thread, finalComment.id);
    const root_title = thread.title || '';

    const allNotificationOptions: NotificationOptions[] = [];

    // build notification for root thread
    allNotificationOptions.push({
      categoryId: NotificationCategories.NewComment,
      objectId: `discussion_${threadId}`,
      notificationData: {
        created_at: new Date(),
        thread_id: threadId,
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
        author_chain: finalComment.Address.chain,
        url: cwUrl,
        title: root_title,
        chain: finalComment.chain,
        body: finalComment.text,
      },
      excludeAddresses: excludedAddrs,
    });

    // if child comment, build notification for parent author
    if (parentId && parentComment) {
      allNotificationOptions.push({
        categoryId: NotificationCategories.NewComment,
        objectId: `comment-${parentId}`,
        notificationData: {
          created_at: new Date(),
          thread_id: +threadId,
          root_title,
          root_type: ProposalType.Thread,
          comment_id: +finalComment.id,
          comment_text: finalComment.text,
          parent_comment_id: +parentId,
          parent_comment_text: parentComment.text,
          chain_id: finalComment.chain,
          author_address: finalComment.Address.address,
          author_chain: finalComment.Address.chain,
        },
        webhookData: null,
        excludeAddresses: excludedAddrs,
      });

      // notify mentioned users if they have permission to view the originating forum
      if (mentionedAddresses?.length > 0) {
        mentionedAddresses.map((mentionedAddress) => {
          if (!mentionedAddress.User) {
            return; // some Addresses may be missing users, e.g. if the user removed the address
          }
          const shouldNotifyMentionedUser = true;
          if (shouldNotifyMentionedUser) {
            allNotificationOptions.push({
              categoryId: NotificationCategories.NewMention,
              objectId: `user-${mentionedAddress.User.id}`,
              notificationData: {
                created_at: new Date(),
                thread_id: +threadId,
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
          }
        });
      }
    }

    // update author last saved (in background)
    address.last_active = new Date();
    address.save();

    // update proposal updated_at timestamp
    thread.last_commented_on = new Date();
    thread.save();

    const analyticsOptions = {
      event: MixpanelCommunityInteractionEvent.CREATE_COMMENT,
      community: chain.id,
      isCustomDomain: null,
    };

    return [finalComment.toJSON(), allNotificationOptions, analyticsOptions];
  }

  async deleteThread(user: UserInstance, threadId: number): Promise<void> {
    // find thread
    const thread = await this.models.Thread.findOne({
      where: {
        id: threadId,
      },
      include: [{ model: this.models.Address, as: 'Address' }],
    });
    if (!thread) {
      throw new Error(`${Errors.ThreadNotFound}: ${threadId}`);
    }

    // check ban
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: thread.chain,
      address: thread.Address.address,
    });
    if (!canInteract) {
      throw new Error(`Ban error: ${banError}`);
    }

    // check ownership (bypass if admin)
    const userOwnedAddressIds = (await user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);

    const isAuthor = userOwnedAddressIds.includes(thread.Address.id);

    const isAdminOrMod = await findOneRole(
      this.models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      thread.chain,
      ['admin', 'moderator']
    );
    if (!isAuthor && !isAdminOrMod) {
      throw new Error(Errors.NotOwned);
    }

    await deleteThreadFromDb(this.models, thread.id);
  }

  async updateThread(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    threadId: number,
    title?: string,
    body?: string,
    stage?: string,
    url?: string,
    attachments?: any,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ThreadAttributes, NotificationOptions[]]> {
    const userOwnedAddresses = await user.getAddresses();
    const userOwnedAddressIds = userOwnedAddresses
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    const collaboration = await this.models.Collaboration.findOne({
      where: {
        thread_id: threadId,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
    });

    const admin = await findOneRole(
      this.models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      chain.id,
      ['admin']
    );

    // check if banned
    if (!admin) {
      const [canInteract, banError] = await this.banCache.checkBan({
        chain: chain.id,
        address: address.address,
      });
      if (!canInteract) {
        throw new Error(`${Errors.BanError}: ${banError}`);
      }
    }

    let thread;
    if (collaboration || admin) {
      thread = await this.models.Thread.findOne({
        where: {
          id: threadId,
        },
      });
    } else {
      thread = await this.models.Thread.findOne({
        where: {
          id: threadId,
          address_id: { [Op.in]: userOwnedAddressIds },
        },
      });
    }
    if (!thread) {
      throw new Error(`${Errors.ThreadNotFound}: ${threadId}`);
    }

    // check attachments
    if (thread.kind === 'discussion') {
      if (
        (!body || !body.trim()) &&
        (!attachments || attachments.length === 0)
      ) {
        throw new Error(Errors.NoBodyOrAttachment);
      }
    }

    const attachFiles = async () => {
      if (attachments && typeof attachments === 'string') {
        await this.models.Attachment.create({
          attachable: 'thread',
          attachment_id: threadId,
          url: attachments,
          description: 'image',
        });
      } else if (attachments) {
        await Promise.all(
          attachments.map((url_) =>
            this.models.Attachment.create({
              attachable: 'thread',
              attachment_id: threadId,
              url: url_,
              description: 'image',
            })
          )
        );
      }
    };

    let latestVersion;
    try {
      latestVersion = JSON.parse(thread.version_history[0]).body;
    } catch (e) {
      console.log(e);
    }
    // If new comment body text has been submitted, create another version history entry
    if (decodeURIComponent(body) !== latestVersion) {
      const recentEdit: any = {
        timestamp: moment(),
        author: address.address,
        body: decodeURIComponent(body),
      };
      const versionHistory: string = JSON.stringify(recentEdit);
      const arr = thread.version_history;
      arr.unshift(versionHistory);
      thread.version_history = arr;
    }

    // patch thread properties
    if (title) {
      thread.title = title;
    }
    if (typeof body !== 'undefined') {
      thread.body = body;
      thread.plaintext = (() => {
        try {
          return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
        } catch (e) {
          return decodeURIComponent(body);
        }
      })();
    }
    if (typeof stage !== 'undefined') {
      thread.stage = stage;
    }
    if (typeof canvasSession !== 'undefined') {
      thread.canvas_session = canvasSession;
      thread.canvas_action = canvasAction;
      thread.canvas_hash = canvasHash;
    }
    if (typeof url !== 'undefined' && thread.kind === 'link') {
      if (validURL(url)) {
        thread.url = url;
      } else {
        throw new Error(Errors.InvalidLink);
      }
    }
    thread.last_edited = new Date().toISOString();

    await thread.save();
    await attachFiles();

    const finalThread = await this.models.Thread.findOne({
      where: { id: thread.id },
      include: [
        { model: this.models.Address, as: 'Address' },
        {
          model: this.models.Address,
          // through: models.Collaboration,
          as: 'collaborators',
        },
        this.models.Attachment,
        { model: this.models.Topic, as: 'topic' },
      ],
    });

    // build notifications
    const allNotificationOptions: NotificationOptions[] = [];

    allNotificationOptions.push({
      categoryId: NotificationCategories.ThreadEdit,
      objectId: '',
      notificationData: {
        created_at: new Date(),
        thread_id: +finalThread.id,
        root_type: ProposalType.Thread,
        root_title: finalThread.title,
        chain_id: finalThread.chain,
        author_address: finalThread.Address.address,
        author_chain: finalThread.Address.chain,
      },
      // don't send webhook notifications for edits
      webhookData: null,
      excludeAddresses: [userOwnedAddresses[0].address],
    });

    let mentions;
    try {
      const previousDraftMentions = parseUserMentions(latestVersion);
      const currentDraftMentions = parseUserMentions(decodeURIComponent(body));
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
          try {
            const mentionedUser = await this.models.Address.findOne({
              where: {
                chain: mention[0],
                address: mention[1],
              },
              include: [this.models.User],
            });
            return mentionedUser;
          } catch (err) {
            return null;
          }
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
            thread_id: +finalThread.id,
            root_type: ProposalType.Thread,
            root_title: finalThread.title,
            comment_text: finalThread.body,
            chain_id: finalThread.chain,
            author_address: finalThread.Address.address,
            author_chain: finalThread.Address.chain,
          },
          webhookData: null,
          excludeAddresses: [finalThread.Address.address],
        });
      });
    }

    // update address last active
    address.last_active = new Date();
    address.save();

    return [finalThread.toJSON(), allNotificationOptions];
  }

  async createThread(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    title: string,
    body: string,
    kind: string,
    readOnly: boolean,
    topicId?: number,
    topicName?: string,
    stage?: string,
    url?: string,
    attachments?: any,
    canvasAction?: any,
    canvasSession?: any,
    canvasHash?: any
  ): Promise<[ThreadAttributes, NotificationOptions[], AnalyticsOptions]> {
    if (kind === 'discussion') {
      if (!title || !title.trim()) {
        throw new Error(Errors.DiscussionMissingTitle);
      }
      if (
        (!body || !body.trim()) &&
        (!attachments['attachments[]'] ||
          attachments['attachments[]'].length === 0)
      ) {
        throw new Error(Errors.NoBodyOrAttachments);
      }
      try {
        const quillDoc = JSON.parse(decodeURIComponent(body));
        if (
          quillDoc.ops.length === 1 &&
          quillDoc.ops[0].insert.trim() === '' &&
          (!attachments || attachments.length === 0)
        ) {
          throw new Error(Errors.NoBodyOrAttachments);
        }
      } catch (e) {
        // check always passes if the body isn't a Quill document
      }
    } else if (kind === 'link') {
      if (!title?.trim() || !url?.trim()) {
        throw new Error(Errors.LinkMissingTitleOrUrl);
      }
    } else {
      throw new Error(Errors.UnsupportedKind);
    }

    // check if banned
    const [canInteract, banError] = await this.banCache.checkBan({
      chain: chain.id,
      address: address.address,
    });
    if (!canInteract) {
      throw new Error(`Ban error: ${banError}`);
    }

    // Render a copy of the thread to plaintext for the search indexer
    const plaintext = (() => {
      try {
        return renderQuillDeltaToText(JSON.parse(decodeURIComponent(body)));
      } catch (e) {
        return decodeURIComponent(body);
      }
    })();

    // New threads get an empty version history initialized, which is passed
    // the thread's first version, formatted on the frontend with timestamps
    const firstVersion: any = {
      timestamp: moment(),
      author: address,
      body: decodeURIComponent(body),
    };
    const version_history: string[] = [JSON.stringify(firstVersion)];

    const threadContent: Partial<ThreadAttributes> = {
      chain: chain.id,
      address_id: address.id,
      title,
      body,
      plaintext,
      version_history,
      kind,
      stage,
      url,
      read_only: readOnly,
      canvas_action: canvasAction,
      canvas_session: canvasSession,
      canvas_hash: canvasHash,
    };

    // begin essential database changes within transaction
    const newThreadId = await this.models.sequelize.transaction(
      async (transaction) => {
        // New Topic table entries created
        if (topicId) {
          threadContent.topic_id = +topicId;
        } else if (topicName) {
          const [topic] = await this.models.Topic.findOrCreate({
            where: {
              name: topicName,
              chain_id: chain?.id || null,
            },
            transaction,
          });
          threadContent.topic_id = topic.id;
          topicId = topic.id;
        } else {
          if (chain.topics?.length) {
            throw new Error(
              'Must pass a topic_name string and/or a numeric topic_id'
            );
          }
        }

        if (
          chain &&
          (chain.type === ChainType.Token ||
            chain.network === ChainNetwork.Ethereum)
        ) {
          // skip check for admins
          const isAdmin = await findAllRoles(
            this.models,
            { where: { address_id: address.id } },
            chain.id,
            ['admin']
          );
          if (!user.isAdmin && isAdmin.length === 0) {
            let canReact;
            try {
              canReact = await validateTopicThreshold(
                this.tokenBalanceCache,
                this.models,
                topicId,
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

        const thread = await this.models.Thread.create(threadContent, {
          transaction,
        });
        if (attachments && typeof attachments === 'string') {
          await this.models.Attachment.create(
            {
              attachable: 'thread',
              attachment_id: thread.id,
              url: attachments,
              description: 'image',
            },
            { transaction }
          );
        } else if (attachments) {
          const data = [];
          attachments.map((u) => {
            data.push({
              attachable: 'thread',
              attachment_id: thread.id,
              url: u,
              description: 'image',
            });
          });
          await this.models.Attachment.bulkCreate(data, { transaction });
        }

        address.last_active = new Date();
        await address.save({ transaction });

        return thread.id;
        // end of transaction
      }
    );

    const finalThread = await this.models.Thread.findOne({
      where: { id: newThreadId },
      include: [
        { model: this.models.Address, as: 'Address' },
        this.models.Attachment,
        { model: this.models.Topic, as: 'topic' },
      ],
    });

    // exit early on error, do not emit notifications
    if (!finalThread) {
      throw new Error(Errors.FailedCreateThread);
    }

    // -----

    // auto-subscribe thread creator to comments & reactions
    await this.models.Subscription.create({
      subscriber_id: user.id,
      category_id: NotificationCategories.NewComment,
      object_id: `discussion_${finalThread.id}`,
      thread_id: finalThread.id,
      chain_id: finalThread.chain,
      is_active: true,
    });
    await this.models.Subscription.create({
      subscriber_id: user.id,
      category_id: NotificationCategories.NewReaction,
      object_id: `discussion_${finalThread.id}`,
      thread_id: finalThread.id,
      chain_id: finalThread.chain,
      is_active: true,
    });

    // auto-subscribe NewThread subscribers to NewComment as well
    // findOrCreate because redundant creation if author is also subscribed to NewThreads
    const location = finalThread.chain;
    try {
      await this.models.sequelize.query(
        `
    WITH irrelevant_subs AS (
      SELECT id
      FROM "Subscriptions"
      WHERE subscriber_id IN (
        SELECT subscriber_id FROM "Subscriptions" WHERE category_id = ? AND object_id = ?
      ) AND category_id = ? AND object_id = ? AND thread_id = ? AND chain_id = ? AND is_active = true
    )
    INSERT INTO "Subscriptions"
    (subscriber_id, category_id, object_id, thread_id, chain_id, is_active, created_at, updated_at)
    SELECT subscriber_id, ? as category_id, ? as object_id, ? as thread_id, ? as
     chain_id, true as is_active, NOW() as created_at, NOW() as updated_at
    FROM "Subscriptions"
    WHERE category_id = ? AND object_id = ? AND id NOT IN (SELECT id FROM irrelevant_subs);
  `,
        {
          raw: true,
          type: 'RAW',
          replacements: [
            NotificationCategories.NewThread,
            location,
            NotificationCategories.NewComment,
            `discussion_${finalThread.id}`,
            finalThread.id,
            finalThread.chain,
            NotificationCategories.NewComment,
            `discussion_${finalThread.id}`,
            finalThread.id,
            finalThread.chain,
            NotificationCategories.NewThread,
            location,
          ],
        }
      );
    } catch (e) {
      console.log(e);
    }

    // grab mentions to notify tagged users
    const bodyText = decodeURIComponent(body);
    let mentionedAddresses;
    try {
      const mentions = parseUserMentions(bodyText);
      if (mentions?.length > 0) {
        mentionedAddresses = await Promise.all(
          mentions.map(async (mention) => {
            return this.models.Address.findOne({
              where: {
                chain: mention[0] || null,
                address: mention[1] || null,
              },
              include: [this.models.User],
            });
          })
        );
        // filter null results
        mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
      }
    } catch (e) {
      throw new Error(Errors.ParseMentionsFailed);
    }

    const excludedAddrs = (mentionedAddresses || []).map(
      (addr) => addr.address
    );
    excludedAddrs.push(finalThread.Address.address);

    // dispatch notifications to subscribers of the given chain
    const allNotificationOptions: NotificationOptions[] = [];

    allNotificationOptions.push({
      categoryId: NotificationCategories.NewThread,
      objectId: location,
      notificationData: {
        created_at: new Date(),
        thread_id: finalThread.id,
        root_type: ProposalType.Thread,
        root_title: finalThread.title,
        comment_text: finalThread.body,
        chain_id: finalThread.chain,
        author_address: finalThread.Address.address,
        author_chain: finalThread.Address.chain,
      },
      webhookData: {
        user: finalThread.Address.address,
        author_chain: finalThread.Address.chain,
        url: getThreadUrl(finalThread),
        title: title,
        bodyUrl: url,
        chain: finalThread.chain,
        body: finalThread.body,
      },
      excludeAddresses: excludedAddrs,
    });

    // notify mentioned users, given permissions are in place
    if (mentionedAddresses?.length > 0)
      mentionedAddresses.forEach((mentionedAddress) => {
        if (!mentionedAddress.User) {
          return; // some Addresses may be missing users, e.g. if the user removed the address
        }
        allNotificationOptions.push({
          categoryId: NotificationCategories.NewMention,
          objectId: `user-${mentionedAddress.User.id}`,
          notificationData: {
            created_at: new Date(),
            thread_id: finalThread.id,
            root_type: ProposalType.Thread,
            root_title: finalThread.title,
            comment_text: finalThread.body,
            chain_id: finalThread.chain,
            author_address: finalThread.Address.address,
            author_chain: finalThread.Address.chain,
          },
          webhookData: null,
          excludeAddresses: [finalThread.Address.address],
        });
      });

    const analyticsOptions = {
      event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
      community: chain.id,
      isCustomDomain: null,
    };

    return [finalThread.toJSON(), allNotificationOptions, analyticsOptions];
  }

  async getThreadsByIds(threadIds: number[]): Promise<ThreadAttributes[]> {
    let threads;
    threads = await this.models.Thread.findAll({
      where: {
        id: { [Op.in]: threadIds },
        // chain: req.chain ? req.chain.id : undefined,
      },
      include: [
        {
          model: this.models.Address,
          as: 'Address',
        },
        {
          model: this.models.Address,
          // through: models.Collaboration,
          as: 'collaborators',
        },
        {
          model: this.models.Topic,
          as: 'topic',
        },
        {
          model: this.models.Reaction,
          as: 'reactions',
          include: [
            {
              model: this.models.Address,
              as: 'Address',
              required: true,
            },
          ],
        },
      ],
    });

    threads = await getThreadsWithCommentCount({
      threads: threads.map((th) => th.toJSON()),
      models: this.models,
    });

    return threads;
  }

  async getActiveThreads(
    chain: ChainInstance,
    threadsPerTopic: number
  ): Promise<ThreadAttributes[]> {
    const allThreads = [];
    if (
      !threadsPerTopic ||
      Number.isNaN(threadsPerTopic) ||
      threadsPerTopic < MIN_THREADS_PER_TOPIC ||
      threadsPerTopic > MAX_THREADS_PER_TOPIC
    ) {
      threadsPerTopic = 3;
    }

    const communityWhere = { chain_id: chain.id };
    const communityTopics = await this.models.Topic.findAll({
      where: communityWhere,
    });

    const threadInclude = [
      { model: this.models.Address, as: 'Address' },
      { model: this.models.Address, as: 'collaborators' },
      { model: this.models.Topic, as: 'topic', required: true },
    ];

    let allRecentTopicThreadsRaw = [];
    allRecentTopicThreadsRaw = await Promise.all(
      communityTopics.map(async (topic) => {
        return await this.models.Thread.findAll({
          where: {
            topic_id: topic.id,
          },
          include: threadInclude,
          limit: threadsPerTopic,
          order: [
            ['created_at', 'DESC'],
            ['last_commented_on', 'DESC'],
          ],
        });
      })
    );

    allRecentTopicThreadsRaw = allRecentTopicThreadsRaw.flat();

    const allRecentTopicThreads = allRecentTopicThreadsRaw.map((t) => {
      return t.toJSON();
    });

    const allThreadsWithCommentsCount = await getThreadsWithCommentCount({
      threads: allRecentTopicThreads,
      models: this.models,
      chainId: chain.id,
    });

    communityTopics.forEach((topic) => {
      const threadsWithCommentsCount = allThreadsWithCommentsCount.filter(
        (thread) => thread.topic_id === topic.id
      );
      allThreads.push(...(threadsWithCommentsCount || []));
    });

    return allThreads;
  }

  async searchThreads(
    chain: ChainInstance,
    searchTerm: string,
    threadTitleOnly: boolean,
    sort: string,
    page: number,
    pageSize: number
  ): Promise<ThreadAttributes[]> {
    if (threadTitleOnly) {
      const encodedSearchTerm = encodeURIComponent(searchTerm);
      const params: any = {
        title: {
          [Op.or]: [
            { [Op.iLike]: `%${encodedSearchTerm}%` },
            { [Op.iLike]: `%${searchTerm}%` },
          ],
        },
      };
      if (chain) {
        params.chain = chain.id;
      }
      const threads = await this.models.Thread.findAll({
        where: params,
        limit: pageSize || 20,
        attributes: {
          exclude: ['body', 'plaintext', 'version_history'],
        },
        include: [
          {
            model: this.models.Address,
            as: 'Address',
          },
        ],
      });
      return threads;
    }

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
        sortOptions = { column: '"Threads".created_at', direction: 'DESC' };
        break;
      case 'oldest':
        sortOptions = { column: '"Threads".created_at', direction: 'ASC' };
        break;
    }

    const { sql: paginationSort, bind: paginationBind } = buildPaginationSql({
      limit: pageSize || 10,
      page: page || 1,
      orderBy: sortOptions.column,
      orderDirection: sortOptions.direction,
    });

    const bind: PaginationSqlBind & {
      chain?: string;
      searchTerm?: string;
    } = {
      searchTerm: searchTerm,
      ...paginationBind,
    };
    if (chain) {
      bind.chain = chain.id;
    }

    const chainWhere = bind.chain ? '"Threads".chain = $chain AND' : '';

    const threads = await this.models.sequelize.query(
      `
    SELECT
        "Threads".id,
        "Threads".title,
        "Threads".body,
        CAST("Threads".id as VARCHAR) as proposalId,
        'thread' as type,
        "Addresses".id as address_id,
        "Addresses".address,
        "Addresses".chain as address_chain,
        "Threads".created_at,
        "Threads".chain,
        ts_rank_cd("Threads"._search, query) as rank
      FROM "Threads"
      JOIN "Addresses" ON "Threads".address_id = "Addresses".id,
      websearch_to_tsquery('english', $searchTerm) as query
      WHERE
        ${chainWhere}
        "Threads".deleted_at IS NULL AND
        query @@ "Threads"._search
      ${paginationSort}
  `,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    );

    return threads as ThreadAttributes[];
  }

  async getBulkThreads(
    chain: ChainInstance,
    stage: string,
    topicId: number,
    includePinnedThreads: boolean,
    page: number,
    limit: number,
    orderBy: string,
    fromDate: string,
    toDate: string
  ): Promise<{
    numVotingThreads: number;
    threads: ThreadAttributes[];
    limit: number;
    page: number;
  }> {
    // query params that bind to sql query
    const bind = (() => {
      const _limit = limit ? (limit > 500 ? 500 : limit) : 20;
      const _page = page || 1;
      const _offset = _limit * (_page - 1) || 0;
      const _to_date = toDate || moment().toISOString();

      return {
        from_date: fromDate,
        to_date: _to_date,
        page: _page,
        limit: _limit,
        offset: _offset,
        chain: chain.id,
        ...(stage && { stage }),
        ...(topicId && { topic_id: topicId }),
      };
    })();

    // sql query parts that order results by provided query param
    const orderByQueries = {
      'createdAt:asc': 'threads.thread_created ASC',
      'createdAt:desc': 'threads.thread_created DESC',
      'numberOfComments:asc': 'threads_number_of_comments ASC',
      'numberOfComments:desc': 'threads_number_of_comments DESC',
      'numberOfLikes:asc': 'threads_total_likes ASC',
      'numberOfLikes:desc': 'threads_total_likes DESC',
    };

    // get response threads from query
    let responseThreads;
    try {
      responseThreads = await this.models.sequelize.query(
        `
      SELECT addr.id AS addr_id, addr.address AS addr_address, last_commented_on,
        addr.chain AS addr_chain, threads.thread_id, thread_title,
        threads.marked_as_spam_at,
        thread_chain, thread_created, thread_updated, thread_locked, threads.kind,
        threads.read_only, threads.body, threads.stage,
        threads.has_poll, threads.plaintext,
        threads.url, threads.pinned, COALESCE(threads.number_of_comments,0) as threads_number_of_comments,
        threads.reaction_ids, threads.reaction_type, threads.addresses_reacted, COALESCE(threads.total_likes, 0) as threads_total_likes,
        threads.links as links,
        topics.id AS topic_id, topics.name AS topic_name, topics.description AS topic_description,
        topics.chain_id AS topic_chain,
        topics.telegram AS topic_telegram,
        collaborators
      FROM "Addresses" AS addr
      RIGHT JOIN (
        SELECT t.id AS thread_id, t.title AS thread_title, t.address_id, t.last_commented_on,
          t.created_at AS thread_created,
          t.marked_as_spam_at,
          t.updated_at AS thread_updated,
          t.locked_at AS thread_locked,
          t.chain AS thread_chain, t.read_only, t.body, comments.number_of_comments,
          reactions.reaction_ids, reactions.reaction_type, reactions.addresses_reacted, reactions.total_likes,
          t.has_poll,
          t.plaintext,
          t.stage, t.url, t.pinned, t.topic_id, t.kind, t.links, ARRAY_AGG(DISTINCT
            CONCAT(
              '{ "address": "', editors.address, '", "chain": "', editors.chain, '" }'
              )
            ) AS collaborators
        FROM "Threads" t
        LEFT JOIN "Collaborations" AS collaborations
        ON t.id = collaborations.thread_id
        LEFT JOIN "Addresses" editors
        ON collaborations.address_id = editors.id
        LEFT JOIN (
            SELECT thread_id, COUNT(*)::int AS number_of_comments
            FROM "Comments"
            WHERE deleted_at IS NULL
            GROUP BY thread_id
        ) comments
        ON t.id = comments.thread_id
        LEFT JOIN (
            SELECT thread_id,
            COUNT(r.id)::int AS total_likes,
            STRING_AGG(ad.address::text, ',') AS addresses_reacted,
            STRING_AGG(r.reaction::text, ',') AS reaction_type,
            STRING_AGG(r.id::text, ',') AS reaction_ids
            FROM "Reactions" as r
            LEFT JOIN "Addresses" ad
            ON r.address_id = ad.id
            GROUP BY thread_id
        ) reactions
        ON t.id = reactions.thread_id
        WHERE t.deleted_at IS NULL
          AND t.chain = $chain
          ${topicId ? ` AND t.topic_id = $topic_id ` : ''}
          ${stage ? ` AND t.stage = $stage ` : ''}
          AND (${includePinnedThreads ? 't.pinned = true OR' : ''}
          (COALESCE(t.last_commented_on, t.created_at) < $to_date AND t.pinned = false))
          GROUP BY (t.id, COALESCE(t.last_commented_on, t.created_at), comments.number_of_comments,
          reactions.reaction_ids, reactions.reaction_type, reactions.addresses_reacted, reactions.total_likes)
          ORDER BY t.pinned DESC, COALESCE(t.last_commented_on, t.created_at) DESC
        ) threads
      ON threads.address_id = addr.id
      LEFT JOIN "Topics" topics
      ON threads.topic_id = topics.id
      ${fromDate ? ' WHERE threads.thread_created > $from_date ' : ''}
      ${
        toDate
          ? (fromDate ? ' AND ' : ' WHERE ') +
            ' threads.thread_created < $to_date '
          : ''
      }
      ${includePinnedThreads || orderByQueries[orderBy] ? 'ORDER BY ' : ''}
      ${includePinnedThreads ? ' threads.pinned DESC' : ''}
      ${
        orderByQueries[orderBy]
          ? (includePinnedThreads ? ',' : '') + orderByQueries[orderBy]
          : ''
      }
      LIMIT $limit OFFSET $offset
    `,
        {
          bind,
          type: QueryTypes.SELECT,
        }
      );
    } catch (e) {
      console.error(e);
      throw new ServerError('Could not fetch threads');
    }

    const processLinks = async (thread) => {
      let chain_entity_meta = [];
      if (thread.links) {
        const ces = thread.links.filter((item) => item.source === 'proposal');
        if (ces.length > 0) {
          chain_entity_meta = ces.map((ce: Link) => {
            return { ce_id: parseInt(ce.identifier), title: ce.title };
          });
        }
      }
      return { chain_entity_meta };
    };

    // transform thread response
    let threads = responseThreads.map(async (t) => {
      const collaborators = JSON.parse(t.collaborators[0]).address?.length
        ? t.collaborators.map((c) => JSON.parse(c))
        : [];
      const { chain_entity_meta } = await processLinks(t);

      const last_edited = getLastEdited(t);

      const data = {
        id: t.thread_id,
        title: t.thread_title,
        url: t.url,
        body: t.body,
        last_edited,
        kind: t.kind,
        stage: t.stage,
        read_only: t.read_only,
        pinned: t.pinned,
        chain: t.thread_chain,
        created_at: t.thread_created,
        updated_at: t.thread_updated,
        locked_at: t.thread_locked,
        links: t.links,
        collaborators,
        chain_entity_meta,
        has_poll: t.has_poll,
        last_commented_on: t.last_commented_on,
        plaintext: t.plaintext,
        Address: {
          id: t.addr_id,
          address: t.addr_address,
          chain: t.addr_chain,
        },
        numberOfComments: t.threads_number_of_comments,
        reactionIds: t.reaction_ids ? t.reaction_ids.split(',') : [],
        addressesReacted: t.addresses_reacted
          ? t.addresses_reacted.split(',')
          : [],
        reactionType: t.reaction_type ? t.reaction_type.split(',') : [],
        marked_as_spam_at: t.marked_as_spam_at,
      };
      if (t.topic_id) {
        data['topic'] = {
          id: t.topic_id,
          name: t.topic_name,
          description: t.topic_description,
          chainId: t.topic_chain,
          telegram: t.telegram,
        };
      }
      return data;
    });

    const countsQuery = `
     SELECT id, title, stage FROM "Threads"
     WHERE chain = $chain AND (stage = 'proposal_in_review' OR stage = 'voting')`;

    const threadsInVoting: ThreadInstance[] = await this.models.sequelize.query(
      countsQuery,
      {
        bind,
        type: QueryTypes.SELECT,
      }
    );
    const numVotingThreads = threadsInVoting.filter(
      (t) => t.stage === 'voting'
    ).length;

    threads = await Promise.all(threads);

    return {
      limit: bind.limit,
      page: bind.page,
      // data params
      threads,
      numVotingThreads,
    };
  }
}
