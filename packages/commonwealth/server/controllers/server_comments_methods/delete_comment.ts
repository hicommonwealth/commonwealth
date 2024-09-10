import { AppError } from '@hicommonwealth/core';
import {
  AddressInstance,
  CommentAttributes,
  UserInstance,
} from '@hicommonwealth/model';
import { WhereOptions } from 'sequelize';
import { validateOwner } from 'server/util/validateOwner';
import { ServerCommentsController } from '../server_comments_controller';

const Errors = {
  CommentNotFound: 'Comment not found',
  BanError: 'Ban error',
  NotOwned: 'Not owned by this user',
};

export type DeleteCommentOptions = {
  user: UserInstance;
  address: AddressInstance;
  commentId?: number;
  messageId?: string;
};

export type DeleteCommentResult = void;

export async function __deleteComment(
  this: ServerCommentsController,
  { user, address, commentId, messageId }: DeleteCommentOptions,
): Promise<DeleteCommentResult> {
  const commentWhere: WhereOptions<CommentAttributes> = {};
  if (commentId) {
    commentWhere.id = commentId;
  }
  if (messageId) {
    commentWhere.discord_meta = {
      message_id: messageId,
    };
  }

  const comment = await this.models.Comment.findOne({
    where: commentWhere,
    include: [{ model: this.models.Thread, attributes: ['community_id'] }],
  });
  const community_id = comment?.Thread?.community_id;

  if (!comment || !community_id) {
    throw new AppError(Errors.CommentNotFound);
  }

  if (address.is_banned) throw new AppError('Banned User');

  const isAdminOrOwner = await validateOwner({
    models: this.models,
    user,
    entity: comment,
    communityId: community_id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdminOrOwner) {
    throw new AppError(Errors.NotOwned);
  }

  await this.models.sequelize.transaction(async (transaction) => {
    // find and delete all associated subscriptions
    await this.models.CommentSubscription.destroy({
      where: {
        comment_id: comment.id!,
      },
      transaction,
    });

    // actually delete
    await comment.destroy({ transaction });
  });
}
