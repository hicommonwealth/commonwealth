import { AppError, ServerError } from '@hicommonwealth/adapters';
import { NotificationCategories, ProposalType } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommentAttributes,
  CommentInstance,
  UserInstance,
} from '@hicommonwealth/model';
import moment from 'moment';
import { sanitizeQuillText } from 'server/util/sanitizeQuillText';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { renderQuillDeltaToText } from '../../../shared/utils';
import { getCommentDepth } from '../../util/getCommentDepth';
import { parseUserMentions } from '../../util/parseUserMentions';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_methods/track';
import { EmitOptions } from '../server_notifications_methods/emit';
import { ServerThreadsController } from '../server_threads_controller';

const Errors = {
  ThreadNotFound: 'Thread not found',
  BanError: 'Ban error',
  InsufficientTokenBalance: 'Insufficient token balance',
  InvalidParent: 'Invalid parent',
  CantCommentOnReadOnly: 'Cannot comment when thread is read_only',
  NestingTooDeep: 'Comments can only be nested 8 levels deep',
  BalanceCheckFailed: 'Could not verify user token balance',
  ThreadArchived: 'Thread is archived',
  ParseMentionsFailed: 'Failed to parse mentions',
  FailedCreateComment: 'Failed to create comment',
};

const MAX_COMMENT_DEPTH = 8; // Sets the maximum depth of comments

export type CreateThreadCommentOptions = {
  user: UserInstance;
  address: AddressInstance;
  parentId: number;
  threadId: number;
  text: string;
  canvasAction?: any;
  canvasSession?: any;
  canvasHash?: any;
  discordMeta?: any;
};

export type CreateThreadCommentResult = [
  CommentAttributes,
  EmitOptions[],
  TrackOptions,
];

export async function __createThreadComment(
  this: ServerThreadsController,
  {
    user,
    address,
    parentId,
    threadId,
    text,
    canvasAction,
    canvasSession,
    canvasHash,
    discordMeta,
  }: CreateThreadCommentOptions,
): Promise<CreateThreadCommentResult> {
  // sanitize text
  text = sanitizeQuillText(text);

  // check if thread exists
  const thread = await this.models.Thread.findOne({
    where: { id: threadId },
  });
  if (!thread) {
    throw new AppError(Errors.ThreadNotFound);
  }

  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: thread.community_id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`${Errors.BanError}: ${banError}`);
  }

  // check if thread is archived
  if (thread.archived_at) {
    throw new AppError(Errors.ThreadArchived);
  }

  // check if thread is read-only
  if (thread.read_only) {
    throw new AppError(Errors.CantCommentOnReadOnly);
  }

  // get parent comment
  let parentComment;
  if (parentId) {
    // check that parent comment is in the same community
    parentComment = await this.models.Comment.findOne({
      where: {
        id: parentId,
        community_id: thread.community_id,
      },
      include: [this.models.Address],
    });
    if (!parentComment) {
      throw new AppError(Errors.InvalidParent);
    }
    // check to ensure comments are never nested more than max depth:
    const [commentDepthExceeded] = await getCommentDepth(
      this.models,
      parentComment,
      MAX_COMMENT_DEPTH,
    );
    if (commentDepthExceeded) {
      throw new AppError(Errors.NestingTooDeep);
    }
  }

  // check balance (bypass for admin)
  const isAdmin = await validateOwner({
    models: this.models,
    user,
    communityId: thread.community_id,
    entity: thread,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdmin) {
    const { isValid, message } = await validateTopicGroupsMembership(
      this.models,
      this.tokenBalanceCache,
      thread.topic_id,
      thread.community_id,
      address,
    );
    if (!isValid) {
      throw new AppError(`${Errors.FailedCreateComment}: ${message}`);
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
  const commentContent: CommentAttributes = {
    thread_id: `${threadId}`,
    text,
    plaintext,
    version_history,
    address_id: address.id,
    community_id: thread.community_id,
    parent_id: null,
    canvas_action: canvasAction,
    canvas_session: canvasSession,
    canvas_hash: canvasHash,
    discord_meta: discordMeta,
    reaction_count: 0,
    reaction_weights_sum: 0,
  };
  if (parentId) {
    Object.assign(commentContent, { parent_id: parentId });
  }

  let comment: CommentInstance;
  try {
    await this.models.sequelize.transaction(async (transaction) => {
      comment = await this.models.Comment.create(commentContent, {
        transaction,
      });
      await this.models.Subscription.bulkCreate(
        [
          {
            subscriber_id: user.id,
            category_id: NotificationCategories.NewReaction,
            community_id: comment.community_id || null,
            comment_id: comment.id,
            is_active: true,
          },
          {
            subscriber_id: user.id,
            category_id: NotificationCategories.NewComment,
            community_id: comment.community_id || null,
            comment_id: comment.id,
            is_active: true,
          },
        ],
        { transaction },
      );
    });
  } catch (e) {
    throw new ServerError('Failed to create comment', e);
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
              community_id: mention[0] || null,
              address: mention[1],
            },
            include: [this.models.User],
          });
          return mentionedUser;
        }),
      );
      mentionedAddresses = mentionedAddresses.filter((addr) => !!addr);
    }
  } catch (e) {
    throw new AppError(Errors.ParseMentionsFailed);
  }

  const excludedAddrs = (mentionedAddresses || []).map((addr) => addr.address);
  excludedAddrs.push(address.address);

  const rootNotifExcludeAddresses = [...excludedAddrs];
  if (parentComment && parentComment.Address) {
    rootNotifExcludeAddresses.push(parentComment.Address.address);
  }

  const root_title = thread.title || '';

  const allNotificationOptions: EmitOptions[] = [];

  // build notification for root thread
  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.NewComment,
      data: {
        created_at: new Date(),
        thread_id: threadId,
        root_title,
        root_type: ProposalType.Thread,
        comment_id: +comment.id,
        comment_text: comment.text,
        chain_id: comment.community_id,
        author_address: address.address,
        author_chain: address.community_id,
      },
    },
    excludeAddresses: rootNotifExcludeAddresses,
  });

  // if child comment, build notification for parent author
  if (parentId && parentComment) {
    allNotificationOptions.push({
      notification: {
        categoryId: NotificationCategories.NewComment,
        data: {
          created_at: new Date(),
          thread_id: +threadId,
          root_title,
          root_type: ProposalType.Thread,
          comment_id: +comment.id,
          comment_text: comment.text,
          parent_comment_id: +parentId,
          parent_comment_text: parentComment.text,
          chain_id: comment.community_id,
          author_address: address.address,
          author_chain: address.community_id,
        },
      },
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
            notification: {
              categoryId: NotificationCategories.NewMention,
              data: {
                mentioned_user_id: mentionedAddress.User.id,
                created_at: new Date(),
                thread_id: +threadId,
                root_title,
                root_type: ProposalType.Thread,
                comment_id: +comment.id,
                comment_text: comment.text,
                chain_id: comment.community_id,
                author_address: address.address,
                author_chain: address.community_id,
              },
            },
            excludeAddresses: [address.address],
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
    community: thread.community_id,
    userId: user.id,
  };

  const commentJson = comment.toJSON();
  commentJson.Address = address.toJSON();
  return [commentJson, allNotificationOptions, analyticsOptions];
}
