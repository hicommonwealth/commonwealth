import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../../models';
import { Op, Sequelize } from 'sequelize';
import { success } from '../../types';

export const Errors = {
  InvalidCommentId: 'Comment ID invalid',
  NotLoggedIn: 'Not logged in',
  CommentNotFound: 'Could not find Comment',
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

  const userAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const [affectedCount] = await models.Comment.update(
    {
      marked_as_spam_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        id: commentId,
        address_id: {
          [Op.in]: userAddressIds,
        },
      },
    }
  );

  if (affectedCount === 0) {
    return next(new AppError(Errors.CommentNotFound));
  }

  return success(res, {});
};
