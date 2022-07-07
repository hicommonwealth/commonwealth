import { NextFunction } from 'express';
import validateRoles from '../../util/validateRoles';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import { DB } from '../../database';

export const Errors = {
  NotLoggedIn: 'Not logged in',
  NotAdmin: 'Must be an admin to edit a chat channel',
  NoChainId: 'No chain id given',
  NoChannelId: 'No channel id given',
  RuleNotFound: 'Rule not found',
};

type EditChatChannelReq = {
  chain_id: string;
  channel_id: string;
  name?: string;
  rule_id?: number;
};

export default async (
  models: DB,
  req: TypedRequestBody<EditChatChannelReq>,
  res: TypedResponse<Record<string, never>>,
  next: NextFunction
) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));

  if (!req.body.chain_id) return next(new Error(Errors.NoChainId));

  if (!req.body.channel_id) return next(new Error(Errors.NoChannelId));

  const requesterIsAdmin = await validateRoles(models, req.user, 'admin', req.body.chain_id);
  if (requesterIsAdmin === null) {
    return next(new Error(Errors.NotAdmin));
  }

  const channel = await models.ChatChannel.findOne({
    where: {
      id: req.body.channel_id,
      chain_id: req.body.chain_id
    }
  });
  if (req.body.name) {
    channel.name = req.body.name;
  }
  if (req.body.rule_id) {
    const rule = await models.Rule.findOne({ where: { id: req.body.rule_id }});
    if (!rule) return next(new Error(Errors.RuleNotFound));
    channel.rule_id = req.body.rule_id;
  }
  await channel.save();

  return success(res, {});
}
