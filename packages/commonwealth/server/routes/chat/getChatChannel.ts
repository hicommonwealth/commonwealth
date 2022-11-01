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
  NoChannelId: 'No channel id given',
  NoChainId: 'No chain id given',
};

/**
 * Gets all relevant messages of a community. A user must be logged in, and they must have a valid address in the
 * community whose chat messages they are trying to view.
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
  // check channel id
  if (!req.query.channel_id) {
    return next(new AppError(Errors.NoChannelId));
  }
  //   check chain id
  if (!req.query.chain_id) {
    return next(new AppError(Errors.NoChainId));
  }
  //   If not logged in check if the channel is public
  if (!req.user?.id) {
    const permission_error = await isAnyonePermitted(
      models,
      req.query.chain_id,
      Action.VIEW_CHAT_CHANNELS
    );
    if (permission_error === PermissionError.NOT_PERMITTED) {
      return next(new AppError(PermissionError.NOT_PERMITTED));
    }
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

  const channel = await models.ChatChannel.findOne({
    where: {
      id: req.query.channel_id,
    },
  });

  return res.json({ status: '200', result: JSON.stringify(channel) });
};
