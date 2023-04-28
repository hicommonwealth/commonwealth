import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';
import type { DB } from '../models';
import type BanCache from '../util/banCheckCache';
import { findOneRole } from '../util/roles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoCommentId: 'Must provide comment ID',
  NotOwned: 'Not owned by this user',
};

const deleteComment = async (
  models: DB,
  banCache: BanCache,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }
  if (!req.body.comment_id) {
    return next(new AppError(Errors.NoCommentId));
  }

  try {
    const userOwnedAddressIds = (await req.user.getAddresses())
      .filter((addr) => !!addr.verified)
      .map((addr) => addr.id);
    let comment = await models.Comment.findOne({
      where: {
        id: req.body.comment_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [models.Address],
    });

    // check if author can delete post
    if (comment) {
      const [canInteract, error] = await banCache.checkBan({
        chain: comment.chain,
        address: comment.Address.address,
      });
      if (!canInteract) {
        return next(new AppError(error));
      }
    }

    if (!comment) {
      comment = await models.Comment.findOne({
        where: {
          id: req.body.comment_id,
        },
        include: [models.Chain],
      });
      const requesterIsAdminOrMod = await findOneRole(
        models,
        { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
        comment?.Chain?.id,
        ['admin', 'moderator']
      );
      if (!requesterIsAdminOrMod) {
        return next(new AppError(Errors.NotOwned));
      }
    }
    // find and delete all associated subscriptions
    models.Subscription.destroy({
      where: {
        offchain_comment_id: comment.id,
      },
    });

    // actually delete
    await comment.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteComment;
