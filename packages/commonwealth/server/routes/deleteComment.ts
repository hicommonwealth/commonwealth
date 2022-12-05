import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from 'common-common/src/logging';
import { DB } from '../models';
import BanCache from '../util/banCheckCache';
import { AppError, ServerError } from 'common-common/src/errors';
import { findAllRoles, findOneRole } from '../util/roles';

const log = factory.getLogger(formatFilename(__filename));

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
      const roleWhere = {
        permission: { [Op.in]: ['admin', 'moderator'] },
        address_id: { [Op.in]: userOwnedAddressIds },
        chain_id: comment.Chain.id,
      };
      const requesterIsAdminOrMod = await findOneRole(
        models,
        { where: { address_id: {[Op.in]: userOwnedAddressIds }} },
        comment?.Chain?.id,
        ['admin', 'moderator']
      );
      if (!requesterIsAdminOrMod) {
        return next(new AppError(Errors.NotOwned));
      }
    }
    // find and delete all associated subscriptions
    await models.Subscription.destroy({
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
