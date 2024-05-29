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
  });
  if (!comment) {
    throw new AppError(Errors.CommentNotFound);
  }

  // check if author can delete post
  const [canInteract, error] = await this.banCache.checkBan({
    communityId: comment.community_id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`${Errors.BanError}: ${error}`);
  }

  const isAdminOrOwner = await validateOwner({
    models: this.models,
    user,
    entity: comment,
    communityId: comment.community_id,
    allowMod: true,
    allowAdmin: true,
    allowSuperAdmin: true,
  });
  if (!isAdminOrOwner) {
    throw new AppError(Errors.NotOwned);
  }

  // find and delete all associated subscriptions
  await this.models.Subscription.destroy({
    where: {
      comment_id: comment.id,
    },
  });

  // actually delete
  await comment.destroy();

  // use callbacks so route returns and this completes in the background
  if (this.globalActivityCache) {
    this.globalActivityCache.deleteActivityFromCache(
      comment.thread_id,
      comment.id,
    );
  }
}
