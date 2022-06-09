import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import BanCache from '../util/banCheckCache';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoCommentId: 'Must provide comment ID',
  NotOwned: 'Not owned by this user',
};

const deleteComment = async (models: DB, banCache: BanCache, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NotLoggedIn));
  }
  if (!req.body.comment_id) {
    return next(new Error(Errors.NoCommentId));
  }

  try {
    const userOwnedAddressIds = (await req.user.getAddresses()).filter((addr) => !!addr.verified).map((addr) => addr.id);
    let comment = await models.OffchainComment.findOne({
      where: {
        id: req.body.comment_id,
        address_id: { [Op.in]: userOwnedAddressIds },
      },
      include: [ models.Address ],
    });

    // check if author can delete post
    if (comment) {
      const [canInteract, error] = await banCache.checkBan({
        chain: comment.chain,
        address: comment.Address.address
      });
      if (!canInteract) {
        return next(new Error(error));
      }
    }

    if (!comment) {
      comment = await models.OffchainComment.findOne({
        where: {
          id: req.body.comment_id,
        },
        include: [ models.Chain ],
      });
      const roleWhere = {
        permission: { [Op.in]: ['admin', 'moderator'] },
        address_id: { [Op.in]: userOwnedAddressIds },
        chain_id: comment.Chain.id,
      };
      const requesterIsAdminOrMod = await models.Role.findOne({
        where: roleWhere
      });
      if (!requesterIsAdminOrMod) {
        return next(new Error(Errors.NotOwned));
      }
    }
    // find and delete all associated subscriptions
    const subscriptions = await models.Subscription.findAll({
      where: {
        offchain_comment_id: comment.id,
      },
    });
    await Promise.all(subscriptions.map((s) => {
      return s.destroy();
    }));

    // actually delete
    await comment.destroy();
    return res.json({ status: 'Success' });
  } catch (e) {
    return next(e);
  }
};

export default deleteComment;
