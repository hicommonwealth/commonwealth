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
import { Op } from 'sequelize';
import { ThreadAttributes } from 'server/models/thread';

const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  BalanceCheckFailed: 'Could not verify user token balance',

  InvalidParent: 'Invalid parent',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',

  NotOwned: 'Not owned by this user',

  NoThreadId: 'Must provide thread_id',
  NoBodyOrAttachment: 'Must provide body or attachment',
  IncorrectOwner: 'Not owned by this user',
  InvalidLink: 'Invalid thread URL',

  ParseMentionsFailed: 'Failed to parse mentions',
};

const MAX_COMMENT_DEPTH = 8; // Sets the maximum depth of comments

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
   * @param title - Title of the thread
   * @param body - Body text of the thread
   * @param stage - Stage of thread
   * @param url - URL of the thread
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
    canvas_action?: any,
    canvas_session?: any,
    canvas_hash?: any
  ): Promise<[ThreadAttributes, NotificationOptions[]]>;

  /**
   * Creates a thread
   *
   * @param user - Current user
   * @param address - Address of the user
   * @param chain - Chain of thread
   * @param threadId - ID of thread
   * @param title - Title of the thread
   * @param body - Body text of the thread
   * @param stage - Stage of thread
   * @param url - URL of the thread
   * @param kind - Kind the thread
   * @param readOnly - Kind the thread
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
    threadId: number,
    title?: string,
    body?: string,
    stage?: string,
    url?: string,
    attachments?: any,
    canvas_action?: any,
    canvas_session?: any,
    canvas_hash?: any
  ): Promise<[ThreadAttributes, NotificationOptions[], AnalyticsOptions]>;
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
          throw new Error(Errors.BalanceCheckFailed);
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
          throw new Error(Errors.BalanceCheckFailed);
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
              include: [this.models.User, this.models.RoleAssignment],
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
    canvas_action?: any,
    canvas_session?: any,
    canvas_hash?: any
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
    if (typeof canvas_session !== 'undefined') {
      thread.canvas_session = canvas_session;
      thread.canvas_action = canvas_action;
      thread.canvas_hash = canvas_hash;
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
    const allNotifications: NotificationOptions[] = [];

    allNotifications.push({
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
              include: [this.models.User, this.models.RoleAssignment],
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
        allNotifications.push({
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

    return [finalThread.toJSON(), allNotifications];
  }

  async createThread(
    user: UserInstance,
    address: AddressInstance,
    chain: ChainInstance,
    threadId: number,
    title?: string,
    body?: string,
    stage?: string,
    url?: string,
    attachments?: any,
    canvas_action?: any,
    canvas_session?: any,
    canvas_hash?: any
  ): Promise<[ThreadAttributes, NotificationOptions[], AnalyticsOptions]> {
    const chain = req.chain;

    const author = req.address;

    const permission_error = await isAddressPermitted(
      models,
      author.id,
      chain.id,
      Action.CREATE_THREAD
    );
    if (!permission_error) {
      return next(new AppError(PermissionError.NOT_PERMITTED));
    }

    const {
      topic_name,
      title,
      body,
      kind,
      stage,
      url,
      readOnly,
      canvas_action,
      canvas_session,
      canvas_hash,
    } = req.body;
    let { topic_id } = req.body;

    if (kind === 'discussion') {
      if (!title || !title.trim()) {
        return next(new AppError(Errors.DiscussionMissingTitle));
      }
      if (
        (!body || !body.trim()) &&
        (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
      ) {
        return next(new AppError(Errors.NoBodyOrAttachments));
      }
      try {
        const quillDoc = JSON.parse(decodeURIComponent(body));
        if (
          quillDoc.ops.length === 1 &&
          quillDoc.ops[0].insert.trim() === '' &&
          (!req.body['attachments[]'] || req.body['attachments[]'].length === 0)
        ) {
          return next(new AppError(Errors.NoBodyOrAttachments));
        }
      } catch (e) {
        // check always passes if the body isn't a Quill document
      }
    } else if (kind === 'link') {
      if (!title?.trim() || !url?.trim()) {
        return next(new Error(Errors.LinkMissingTitleOrUrl));
      }
    } else {
      return next(new AppError(Errors.UnsupportedKind));
    }

    // check if banned
    const [canInteract, banError] = await banCache.checkBan({
      chain: chain.id,
      address: author.address,
    });
    if (!canInteract) {
      return next(new AppError(banError));
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
      author: req.body.author,
      body: decodeURIComponent(req.body.body),
    };
    const version_history: string[] = [JSON.stringify(firstVersion)];

    const threadContent = {
      chain: chain.id,
      address_id: author.id,
      title,
      body,
      plaintext,
      version_history,
      kind,
      stage,
      url,
      read_only: readOnly || false,
      canvas_action,
      canvas_session,
      canvas_hash,
    };

    // begin essential database changes within transaction
    const finalThread = await sequelize.transaction(async (transaction) => {
      // New Topic table entries created
      if (topic_id) {
        threadContent['topic_id'] = +topic_id;
      } else if (topic_name) {
        let topic;
        try {
          [topic] = await models.Topic.findOrCreate({
            where: {
              name: topic_name,
              chain_id: chain?.id || null,
            },
            transaction,
          });
          threadContent['topic_id'] = topic.id;
          topic_id = topic.id;
        } catch (err) {
          return next(err);
        }
      } else {
        if (chain.topics?.length) {
          return next(
            Error('Must pass a topic_name string and/or a numeric topic_id')
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
          models,
          { where: { address_id: author.id } },
          chain.id,
          ['admin']
        );
        if (!req.user.isAdmin && isAdmin.length === 0) {
          const canReact = await validateTopicThreshold(
            tokenBalanceCache,
            models,
            topic_id,
            req.body.address
          );
          if (!canReact) {
            return next(new AppError(Errors.BalanceCheckFailed));
          }
        }
      }

      let thread: ThreadInstance;
      try {
        thread = await models.Thread.create(threadContent, {
          transaction,
        });
      } catch (err) {
        return next(new ServerError(err));
      }
      // TODO: attachments can likely be handled like topics & mentions (see lines 11-14)
      try {
        if (
          req.body['attachments[]'] &&
          typeof req.body['attachments[]'] === 'string'
        ) {
          await models.Attachment.create(
            {
              attachable: 'thread',
              attachment_id: thread.id,
              url: req.body['attachments[]'],
              description: 'image',
            },
            { transaction }
          );
        } else if (req.body['attachments[]']) {
          const data = [];
          req.body['attachments[]'].map((u) => {
            data.push({
              attachable: 'thread',
              attachment_id: thread.id,
              url: u,
              description: 'image',
            });
          });

          await models.Attachment.bulkCreate(data, { transaction });
        }
      } catch (err) {
        return next(err);
      }

      // update author's last activity based on thread creation
      author.last_active = new Date();
      await author.save({ transaction });

      try {
        // re-fetch thread once created
        return await models.Thread.findOne({
          where: { id: thread.id },
          include: [
            { model: models.Address, as: 'Address' },
            models.Attachment,
            { model: models.Topic, as: 'topic' },
          ],
          transaction,
        });
      } catch (err) {
        return next(err);
      }
    });

    // exit early on error, do not emit notifications
    if (!finalThread) return;

    // dispatch post-init hooks asynchronously (subscribing etc), then return immediately
    // TODO: this blocks the event loop -- need to dispatch to a worker so we can continue listening to web queries
    dispatchHooks(models, req, finalThread);

    serverAnalyticsTrack({
      event: MixpanelCommunityInteractionEvent.CREATE_THREAD,
      community: chain.id,
      isCustomDomain: null,
    });

    return res.json({ status: 'Success', result: finalThread.toJSON() });
  }
}
