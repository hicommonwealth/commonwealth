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
  commentMsgId?: string;
};

export type DeleteCommentResult = void;

export async function __deleteComment(
  this: ServerCommentsController,
  { user, address, commentId, messageId, commentMsgId }: DeleteCommentOptions,
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

  // if the commentMsgId is given, validate that it is the same as the field on
  // the comment to be deleted
  if (commentMsgId && comment.canvas_msg_id !== commentMsgId) {
    throw new AppError(
      `comment.canvas_msg_id (${comment.canvas_msg_id}) !== commentMsgId (${commentMsgId})`,
    );
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
      comment_id: comment.id!,
    },
  });

  // actually delete
  await comment.destroy();
}
