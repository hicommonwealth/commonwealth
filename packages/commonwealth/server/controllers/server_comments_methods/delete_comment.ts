import { AddressInstance } from '../../models/address';
import { ChainInstance } from '../../models/chain';
import { UserInstance } from '../../models/user';
import { ServerCommentsController } from '../server_comments_controller';
import { Op } from 'sequelize';
import { findOneRole } from '../../util/roles';

const Errors = {
  CommentNotFound: 'Comment not found',
  BanError: 'Ban error',
  NotOwned: 'Not owned by this user',
};

export type DeleteCommentOptions = {
  user: UserInstance;
  address: AddressInstance;
  chain: ChainInstance;
  commentId: number;
};

export type DeleteCommentResult = void;

export async function __deleteComment(
  this: ServerCommentsController,
  { user, address, chain, commentId }: DeleteCommentOptions
): Promise<DeleteCommentResult> {
  // check if author can delete post
  const [canInteract, error] = await this.banCache.checkBan({
    chain: chain.id,
    address: address.address,
  });
  if (!canInteract) {
    throw new Error(`${Errors.BanError}; ${error}`);
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
      include: [this.models.Chain],
    });
    if (!comment) {
      throw new Error(Errors.CommentNotFound);
    }
    const requesterIsAdminOrMod = await findOneRole(
      this.models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      comment?.Chain?.id,
      ['admin', 'moderator']
    );

    if (!requesterIsAdminOrMod && !user.isAdmin) {
      throw new Error(Errors.NotOwned);
    }
  }

  // find and delete all associated subscriptions
  await this.models.Subscription.destroy({
    where: {
      offchain_comment_id: comment.id,
    },
  });

  // actually delete
  await comment.destroy();
}
