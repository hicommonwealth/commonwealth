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
import { findAllRoles } from '../util/roles';
import { UserInstance } from '../models/user';
import validateTopicThreshold from '../util/validateTopicThreshold';
import { NotificationOptions } from './server_notifications_controller';
import { getThreadUrl, renderQuillDeltaToText } from '../../shared/utils';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';
import { AnalyticsOptions } from './server_analytics_controller';
import { CommentAttributes, CommentInstance } from '../models/comment';
import { getCommentDepth } from '../util/getCommentDepth';
import { parseUserMentions } from '../util/parseUserMentions';
import { Link, ThreadAttributes, ThreadInstance } from '../models/thread';
import { Op, QueryTypes } from 'sequelize';
import getThreadsWithCommentCount from '../util/getThreadCommentsCount';
import { PaginationSqlBind, buildPaginationSql } from '../util/queries';
import { getLastEdited } from '../util/getLastEdited';
import { ServerError } from '../../../common-common/src/errors';

const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  InvalidParent: 'Invalid parent',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',
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
   * @param canvasAction - Canvas metadata
   * @param canvasSession - Canvas metadata
   * @param canvasHash - Canvas metadata
   * @throws `ThreadNotFound`, `BanError`, `BalanceCheckFailed`
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
    author: AddressInstance,
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
          offchain_comment_id: finalComment.id,
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
          offchain_comment_id: finalComment.id,
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

    const allNotifications: NotificationOptions[] = [];

    // build notification for root thread
    allNotifications.push({
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
      allNotifications.push({
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
            allNotifications.push({
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

    return [finalComment.toJSON(), allNotifications, analyticsOptions];
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
