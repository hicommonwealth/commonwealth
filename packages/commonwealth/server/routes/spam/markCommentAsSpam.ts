import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../../models';
import { Op, Sequelize } from 'sequelize';
import { success } from '../../types';
import { findAllRoles } from '../../util/roles';

export const Errors = {
  InvalidCommentId: 'Comment ID invalid',
  NotLoggedIn: 'Not logged in',
  CommentNotFound: 'Could not find Comment',
  NotAdmin: 'Not an admin',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const commentId = req.params.id;
  if (!commentId) {
    return next(new AppError(Errors.InvalidCommentId));
  }

  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  const comment = await models.Comment.findOne({
    where: {
      id: commentId,
    },
  });
  if (!comment) {
    return next(new AppError(Errors.CommentNotFound));
  }
  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(comment.address_id)) {
    // is not author
    const roles = await findAllRoles(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      comment.chain,
      ['admin', 'moderator']
    );
    const role = roles.find((r) => {
      return r.chain_id === comment.chain;
    });
    if (!role) {
      return next(new AppError(Errors.NotAdmin));
    }
  }

  await comment.update({
    marked_as_spam_at: Sequelize.literal('CURRENT_TIMESTAMP'),
  });

  // get comment with updated timestamp
  const updatedComment = await models.Comment.findOne({
    where: {
      id: comment.id,
    },
  });

  return success(res, updatedComment);
};
