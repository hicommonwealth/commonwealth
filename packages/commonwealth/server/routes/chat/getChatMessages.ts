import { NextFunction, Request, Response } from 'express';
import { Action, PermissionError } from 'common-common/src/permissions';
import {
  getActiveAddress,
  isAddressPermitted,
  isAnyonePermitted,
} from '../../util/roles';
import { DB } from '../../models';
import { AppError } from '../../util/errors';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NoValidAddress: 'No valid address',
  NoCommunityId: 'No community id given',
};

/**
 * Gets all relevant messages of a community. A user must be logged in, and they must have a valid address in the
 * community whose chat messages they are trying to view. Or the community must be public.
 * @param models
 * @param req
 * @param res
 * @param next
 */
export default async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    const permission_error = await isAnyonePermitted(
      models,
      req.query.chain_id,
      Action.VIEW_CHAT_CHANNELS
    );
    if (permission_error === PermissionError.NOT_PERMITTED) {
      return next(new AppError(PermissionError.NOT_PERMITTED));
    }
  }

  // check address
  const addressAccount = await models.Address.findOne({
    where: {
      address: req.query.address,
      user_id: req.user.id,
    },
  });
  if (!addressAccount) {
    return next(new AppError(Errors.NoValidAddress));
  }

  // check community id
  if (!req.query.chain_id) {
    return next(new AppError(Errors.NoCommunityId));
  }

  // get active address
  const activeAddressInstance = await getActiveAddress(
    models,
    req.user.id,
    req.query.chain_id
  );

  if (activeAddressInstance) {
    // check if the user has permission to view the channel
    const permission_error = await isAddressPermitted(
      models,
      activeAddressInstance.id,
      req.query.chain_id,
      Action.VIEW_CHAT_CHANNELS
    );

    if (permission_error === PermissionError.NOT_PERMITTED) {
      return next(new AppError(PermissionError.NOT_PERMITTED));
    }
  } else {
    const permission_error = await isAnyonePermitted(
      models,
      req.query.chain_id,
      Action.VIEW_CHAT_CHANNELS
    );
    if (permission_error === PermissionError.NOT_PERMITTED) {
      return next(new AppError(PermissionError.NOT_PERMITTED));
    }
  }

  // get all messages
  const messages = await models.ChatChannel.findAll({
    where: {
      chain_id: req.query.chain_id,
    },
    include: {
      model: models.ChatMessage,
      required: false, // should return channels with no chat messages
    },
  });

  return res.json({ status: '200', result: JSON.stringify(messages) });
};
