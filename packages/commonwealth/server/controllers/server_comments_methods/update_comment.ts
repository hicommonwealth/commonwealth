import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommentAttributes,
  UserInstance,
  emitMentions,
  findMentionDiff,
  parseUserMentions,
} from '@hicommonwealth/model';
import { renderQuillDeltaToText } from '@hicommonwealth/shared';
import { WhereOptions } from 'sequelize';
import { validateOwner } from 'server/util/validateOwner';
import { addVersionHistory } from '../../util/versioning';
import { ServerCommentsController } from '../server_comments_controller';

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

export type UpdateCommentResult = [CommentAttributes];

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

  if (address.is_banned) throw new AppError('Banned User');

  const isAuthor = await validateOwner({
    models: this.models,
    user,
    communityId: thread.community_id,
    entity: comment,
    allowSuperAdmin: true,
  });
  if (!isAuthor) {
    throw new AppError(Errors.NotAuthor);
  }

  const { latestVersion, versionHistory } = addVersionHistory(
    // @ts-expect-error StrictNullChecks
    comment.version_history,
    commentBody,
    address,
  );

  const text = commentBody;
  const plaintext = (() => {
    try {
      return renderQuillDeltaToText(
        JSON.parse(decodeURIComponent(commentBody)),
      );
    } catch (e) {
      return decodeURIComponent(commentBody);
    }
  })();

  const previousDraftMentions = parseUserMentions(latestVersion);
  const currentDraftMentions = parseUserMentions(
    decodeURIComponent(commentBody),
  );

  const mentions = findMentionDiff(previousDraftMentions, currentDraftMentions);

  await this.models.sequelize.transaction(async (transaction) => {
    await this.models.Comment.update(
      {
        text,
        plaintext,
        version_history: versionHistory ?? undefined,
      },
      {
        where: { id: comment.id },
        transaction,
      },
    );

    if (versionHistory) {
      await this.models.CommentVersionHistory.create(
        {
          comment_id: comment.id!,
          text: text!,
          timestamp: new Date(),
        },
        {
          transaction,
        },
      );
    }

    await emitMentions(this.models, transaction, {
      authorAddressId: address.id!,
      authorUserId: user.id!,
      authorAddress: address.address,
      mentions: mentions,
      comment,
      community_id: thread.community_id,
    });
  });

  const finalComment = await this.models.Comment.findOne({
    where: { id: comment.id },
    include: [this.models.Address],
  });

  // update address last active
  address.last_active = new Date();
  address.save();

  // @ts-expect-error StrictNullChecks
  return [finalComment.toJSON()];
}
