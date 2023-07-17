import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { CommentAttributes, CommentInstance } from '../../models/comment';
import { UserInstance } from '../../models/user';
import { EmitOptions } from '../server_notifications_methods/emit';
import { TrackOptions } from '../server_analytics_methods/track';
import { getCommentDepth } from '../../util/getCommentDepth';
import {
  ChainNetwork,
  ChainType,
  NotificationCategories,
  ProposalType,
} from '../../../../common-common/src/types';
import { findAllRoles } from '../../util/roles';
import validateTopicThreshold from '../../util/validateTopicThreshold';
import { ServerError } from 'near-api-js/lib/utils/rpc_errors';
import { AppError } from '../../../../common-common/src/errors';
import { getThreadUrl, renderQuillDeltaToText } from '../../../shared/utils';
import moment from 'moment';
import { parseUserMentions } from '../../util/parseUserMentions';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';

const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  InvalidParent: 'Invalid parent',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',
  BalanceCheckFailed: 'Could not verify user token balance',
};

const MAX_COMMENT_DEPTH = 8; // Sets the maximum depth of comments

export type CreateThreadCommentOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  parentId: number;
  threadId: number;
  text: string;
  attachments: any;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
};

export type CreateThreadCommentResult = [
  CommentAttributes,
  EmitOptions[],
  TrackOptions
];

export async function __createThreadComment({
  user,
  address,
  chain,
  parentId,
  threadId,
  text,
  attachments,
  canvasAction,
  canvasSession,
  canvasHash,
}: CreateThreadCommentOptions): Promise<CreateThreadCommentResult> {
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

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(finalComment.Address.address);

  const cwUrl = getThreadUrl(thread, finalComment.id);
  const root_title = thread.title || '';

  const allNotificationOptions: EmitOptions[] = [];

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
