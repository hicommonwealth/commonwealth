import { AppError } from 'common-common/src/errors';
import type { NextFunction } from 'express';
import type { DB } from '../../models';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';
import validateRoles from '../../util/validateRoles';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be an admin to edit a chat channel',
  NoChainId: 'No chain id given',
  NoChannelId: 'No channel id given',
};

type EditChatChannelReq = {
  chain_id: string;
  channel_id: string;
  name?: string;
};

export default async (
  models: DB,
  req: TypedRequestBody<EditChatChannelReq>,
  res: TypedResponse<Record<string, never>>,
  next: NextFunction
) => {
  if (!req.user) return next(new AppError(Errors.NotLoggedIn));

  if (!req.body.chain_id) return next(new AppError(Errors.NoChainId));

  if (!req.body.channel_id) return next(new AppError(Errors.NoChannelId));

  const requesterIsAdmin = await validateRoles(
    models,
    req.user,
    'admin',
    req.body.chain_id
  );
  if (requesterIsAdmin === null) {
    return next(new AppError(Errors.NotAdmin));
  }

  const channel = await models.ChatChannel.findOne({
    where: {
      id: req.body.channel_id,
      chain_id: req.body.chain_id,
    },
  });
  if (req.body.name) {
    channel.name = req.body.name;
  }
  await channel.save();

  return success(res, {});
};
