import { AppError } from '@hicommonwealth/adapters';
import {
  AddressInstance,
  CommunityInstance,
  UserInstance,
} from '@hicommonwealth/model';
import { Op } from 'sequelize';
import { findOneRole } from '../../util/roles';
import { ServerCommentsController } from '../server_comments_controller';

const Errors = {
  CommentNotFound: 'Comment not found',
  BanError: 'Ban error',
  NotOwned: 'Not owned by this user',
};

export type DeleteCommentOptions = {
  user: UserInstance;
  address: AddressInstance;
  community: CommunityInstance;
  commentId?: number;
  messageId?: string;
};

export type DeleteCommentResult = void;

export async function __deleteComment(
  this: ServerCommentsController,
  { user, address, community, commentId, messageId }: DeleteCommentOptions,
): Promise<DeleteCommentResult> {
  if (!commentId) {
    // Discord Bot Handling
    const existingComment = await this.models.Comment.findOne({
      where: {
        discord_meta: {
          message_id: messageId,
        },
      },
    });

    if (existingComment) {
      commentId = existingComment.id;
    } else {
      throw new AppError(Errors.CommentNotFound);
    }
  }

  // check if author can delete post
  const [canInteract, error] = await this.banCache.checkBan({
    communityId: community.id,
    address: address.address,
  });
  if (!canInteract) {
    throw new AppError(`${Errors.BanError}: ${error}`);
  }

  const userOwnedAddressIds = (await user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  // find comment, if owned by user
  let comment = await this.models.Comment.findOne({
    where: {
      id: commentId,
      address_id: { [Op.in]: userOwnedAddressIds },
    },
    include: [this.models.Address],
  });

  // if not owned by user, check if is admin/mod
  if (!comment) {
    comment = await this.models.Comment.findOne({
      where: {
        id: commentId,
      },
      include: [this.models.Community],
    });
    if (!comment) {
      throw new AppError(Errors.CommentNotFound);
    }
    const requesterIsAdminOrMod = await findOneRole(
      this.models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      comment?.Chain?.id,
      ['admin', 'moderator'],
    );

    if (!requesterIsAdminOrMod && !user.isAdmin) {
      throw new AppError(Errors.NotOwned);
    }
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
      parseInt(comment.thread_id, 10),
      comment.id,
    );
  }
}
