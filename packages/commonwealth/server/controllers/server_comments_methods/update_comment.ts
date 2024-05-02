import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommentAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { NotificationCategories, ProposalType } from '@hicommonwealth/shared';
import { WhereOptions } from 'sequelize';
import { validateOwner } from 'server/util/validateOwner';
import { renderQuillDeltaToText } from '../../../shared/utils';
import {
  createCommentMentionNotifications,
  findMentionDiff,
  parseUserMentions,
  queryMentionedUsers,
} from '../../util/parseUserMentions';
import { addVersionHistory } from '../../util/versioning';
import { ServerCommentsController } from '../server_comments_controller';
import { EmitOptions } from '../server_notifications_methods/emit';

const Errors = {
  CommentNotFound: 'Comment not found',
  ThreadNotFoundForComment: 'Thread not found for comment',
  BanError: 'Ban error',
  ParseMentionsFailed: 'Failed to parse mentions',
  NoId: 'Must provide id',
  NotAuthor: 'User is not author of comment',
};

export type UpdateCommentOptions = {
  user: UserInstance;
  address: AddressInstance;
  commentId?: number;
  commentBody: string;
  discordMeta?: any;
};

export type UpdateCommentResult = [CommentAttributes, EmitOptions[]];

export async function __updateComment(
  this: ServerCommentsController,
  { user, address, commentId, commentBody, discordMeta }: UpdateCommentOptions,
): Promise<UpdateCommentResult> {
  if (!commentId && !discordMeta) {
    throw new AppError(Errors.NoId);
  }

  const commentWhere: WhereOptions<CommentAttributes> = {};
  if (commentId) {
    commentWhere.id = commentId;
  }
  if (discordMeta) {
    commentWhere.discord_meta = discordMeta;
  }

  const comment = await this.models.Comment.findOne({
    where: commentWhere,
    include: [
      {
        model: this.models.Thread,
        required: true,
      },
    ],
  });
  if (!comment) {
    throw new AppError(Errors.NoId);
  }
  const { Thread: thread } = comment;
  if (!thread) {
    throw new AppError(Errors.ThreadNotFoundForComment);
  }

  // check if banned
  const [canInteract, banError] = await this.banCache.checkBan({
    communityId: comment.community_id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`${Errors.BanError}: ${banError}`);
  }

  const isAuthor = await validateOwner({
    models: this.models,
    user,
    communityId: comment.community_id,
    entity: comment,
    allowSuperAdmin: true,
  });
  if (!isAuthor) {
    throw new AppError(Errors.NotAuthor);
  }

  const { latestVersion, versionHistory } = addVersionHistory(
    comment.version_history,
    commentBody,
    address,
  );

  comment.text = commentBody;
  comment.plaintext = (() => {
    try {
      return renderQuillDeltaToText(
        JSON.parse(decodeURIComponent(commentBody)),
      );
    } catch (e) {
      return decodeURIComponent(commentBody);
    }
  })();
  await comment.save();

  if (versionHistory) {
    // The update above doesn't work because it can't detect array changes so doesn't write it to db
    await this.models.Comment.update(
      {
        version_history: versionHistory,
      },
      {
        where: { id: comment.id },
      },
    );
  }

  const finalComment = await this.models.Comment.findOne({
    where: { id: comment.id },
    include: [this.models.Address],
  });

  const root_title = thread.title || '';

  const allNotificationOptions: EmitOptions[] = [];

  allNotificationOptions.push({
    notification: {
      categoryId: NotificationCategories.CommentEdit,
      data: {
        created_at: new Date(),
        thread_id: comment.thread_id,
        root_title,
        root_type: ProposalType.Thread,
        comment_id: +finalComment.id,
        comment_text: finalComment.text,
        community_id: finalComment.community_id,
        author_address: finalComment.Address.address,
        author_community_id: finalComment.Address.community_id,
      },
    },
    excludeAddresses: [finalComment.Address.address],
  });

  const previousDraftMentions = parseUserMentions(latestVersion);
  const currentDraftMentions = parseUserMentions(
    decodeURIComponent(commentBody),
  );

  const mentions = findMentionDiff(previousDraftMentions, currentDraftMentions);
  const mentionedAddresses = await queryMentionedUsers(mentions, this.models);

  allNotificationOptions.push(
    ...createCommentMentionNotifications(
      mentionedAddresses,
      finalComment,
      finalComment.Address,
    ),
  );

  // update address last active
  address.last_active = new Date();
  address.save();

  return [finalComment.toJSON(), allNotificationOptions];
}
