import { AppError } from 'common-common/src/errors';
import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../../models';
import { Op, Sequelize } from 'sequelize';
import { success } from '../../types';
import { findAllRoles } from '../../util/roles';

export const Errors = {
  InvalidThreadId: 'Thread ID invalid',
  NotLoggedIn: 'Not logged in',
  ThreadNotFound: 'Could not find Thread',
  NotAdmin: 'Not an admin',
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

  const thread = await models.Thread.findOne({
    where: {
      id: threadId,
    },
  });
  if (!thread) {
    return next(new AppError(Errors.ThreadNotFound));
  }
  const userOwnedAddressIds = (await req.user.getAddresses())
    .filter((addr) => !!addr.verified)
    .map((addr) => addr.id);
  if (!userOwnedAddressIds.includes(thread.address_id) && !req.user.isAdmin) {
    // is not author or site admin
    const roles = await findAllRoles(
      models,
      { where: { address_id: { [Op.in]: userOwnedAddressIds } } },
      thread.chain,
      ['admin', 'moderator']
    );
    const role = roles.find((r) => {
      return r.chain_id === thread.chain;
    });
    if (!role) {
      return next(new AppError(Errors.NotAdmin));
    }
  }

  await thread.update({
    marked_as_spam_at: Sequelize.literal('CURRENT_TIMESTAMP'),
  });

  // get thread with updated timestamp
  const updatedThread = await models.Thread.findOne({
    where: {
      id: thread.id,
    },
  });

  return success(res, updatedThread);
};
