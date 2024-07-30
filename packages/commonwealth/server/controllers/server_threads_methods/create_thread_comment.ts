import { AppError, ServerError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommentAttributes,
  CommentInstance,
  UserInstance,
  sanitizeQuillText,
} from '@hicommonwealth/model';
import { PermissionEnum } from '@hicommonwealth/schemas';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import moment from 'moment';
import { MixpanelCommunityInteractionEvent } from '../../../shared/analytics/types';
import { renderQuillDeltaToText } from '../../../shared/utils';
import { getCommentDepth } from '../../util/getCommentDepth';
import {
  emitMentions,
  parseUserMentions,
  uniqueMentions,
} from '../../util/parseUserMentions';
import { validateTopicGroupsMembership } from '../../util/requirementsModule/validateTopicGroupsMembership';
import { validateOwner } from '../../util/validateOwner';
import { TrackOptions } from '../server_analytics_controller';
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
  canvasSignedData?: string;
  canvasMsgId?: string;
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
    canvasSignedData,
    canvasMsgId,
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
      // @ts-expect-error StrictNullChecks
      thread.topic_id,
      thread.community_id,
      address,
      PermissionEnum.CREATE_COMMENT,
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
    author: address,
    body: decodeURIComponent(text),
  };
  const version_history: string[] = [JSON.stringify(firstVersion)];
  const commentContent: CommentAttributes = {
    thread_id: threadId,
    text,
    plaintext,
    version_history,
    // @ts-expect-error StrictNullChecks
    address_id: address.id,
    community_id: thread.community_id,
    parent_id: null,
    // @ts-expect-error <StrictNullChecks>
    canvas_signed_data: canvasSignedData,
    // @ts-expect-error <StrictNullChecks>
    canvas_msg_id: canvasMsgId,
    discord_meta: discordMeta,
    reaction_count: 0,
    reaction_weights_sum: 0,
    created_by: '',
  };

  if (parentId) {
    Object.assign(commentContent, { parent_id: parentId });
  }

  // grab mentions to notify tagged users
  const bodyText = decodeURIComponent(text);
  const mentions = uniqueMentions(parseUserMentions(bodyText));

  let comment: CommentInstance;
  try {
    await this.models.sequelize.transaction(async (transaction) => {
      comment = await this.models.Comment.create(commentContent, {
        transaction,
      });

      await this.models.CommentVersionHistory.create(
        {
          comment_id: comment.id!,
          text: comment.text!,
          timestamp: comment.created_at!,
        },
        {
          transaction,
        },
      );

      await emitMentions(this.models, transaction, {
        // @ts-expect-error StrictNullChecks
        authorAddressId: address.id,
        // @ts-expect-error StrictNullChecks
        authorUserId: user.id,
        authorAddress: address.address,
        mentions: mentions,
        comment,
      });

      await this.models.Subscription.bulkCreate(
        [
          {
            // @ts-expect-error StrictNullChecks
            subscriber_id: user.id,
            category_id: NotificationCategories.NewReaction,
            // @ts-expect-error StrictNullChecks
            community_id: comment.community_id || null,
            comment_id: comment.id!,
            is_active: true,
          },
          {
            // @ts-expect-error StrictNullChecks
            subscriber_id: user.id,
            category_id: NotificationCategories.NewComment,
            // @ts-expect-error StrictNullChecks
            community_id: comment.community_id || null,
            comment_id: comment.id!,
            is_active: true,
          },
        ],
        { transaction },
      );
    });
  } catch (e) {
    throw new ServerError('Failed to create comment', e);
  }

  const allNotificationOptions: EmitOptions[] = [];

  const excludedAddrs: string[] = [];
  excludedAddrs.push(address.address);

  const rootNotifExcludeAddresses = [...excludedAddrs];
  if (parentComment && parentComment.Address) {
    rootNotifExcludeAddresses.push(parentComment.Address.address);
  }

  const root_title = thread.title || '';

  // build notification for root thread
  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.NewComment,
      data: {
        created_at: new Date(),
        thread_id: threadId,
        root_title,
        root_type: ProposalType.Thread,
        // @ts-expect-error StrictNullChecks
        comment_id: +comment.id,
        // @ts-expect-error StrictNullChecks
        comment_text: comment.text,
        // @ts-expect-error StrictNullChecks
        community_id: comment.community_id,
        author_address: address.address,
        author_community_id: address.community_id!,
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
          // @ts-expect-error StrictNullChecks
          comment_id: +comment.id,
          // @ts-expect-error StrictNullChecks
          comment_text: comment.text,
          parent_comment_id: +parentId,
          parent_comment_text: parentComment.text,
          // @ts-expect-error StrictNullChecks
          community_id: comment.community_id,
          author_address: address.address,
          author_community_id: address.community_id!,
        },
      },
      excludeAddresses: excludedAddrs,
    });
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

  // @ts-expect-error StrictNullChecks
  const commentJson = comment.toJSON();
  commentJson.Address = address.toJSON();
  return [commentJson, allNotificationOptions, analyticsOptions];
}
