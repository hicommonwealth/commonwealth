import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../../models';
import { Op, Sequelize } from 'sequelize';
import { success } from '../../types';

export const Errors = {
  InvalidThreadId: 'Thread ID invalid',
  NotLoggedIn: 'Not logged in',
  ThreadNotFound: 'Could not find Thread',
};

export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const threadId = req.params.id;
  if (!threadId) {
    return next(new AppError(Errors.InvalidThreadId));
  }

  if (!req.user) {
    return next(new AppError(Errors.NotLoggedIn));
  }

  const userAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);

  const [affectedCount] = await models.Thread.update(
    {
      marked_as_spam_at: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    {
      where: {
        id: threadId,
        address_id: {
          [Op.in]: userAddressIds,
        },
      },
    }
  );

  if (affectedCount === 0) {
    return next(new AppError(Errors.ThreadNotFound));
  }

  return success(res, {});
};
