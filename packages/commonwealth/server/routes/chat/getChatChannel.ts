import { Action } from 'common-common/src/permissions';
import { checkReadPermitted } from '../../util/roles';
import { DB } from '../../models';
import { AppError } from '../../util/errors';
import { success, TypedRequestQuery, TypedResponse } from '../../types';
import { ChatChannelAttributes } from '../../models/chat_channel';

export const Errors = {
  NoChannelId: 'No channel id given',
  NoChainId: 'No chain id given',
  ChannelNF: 'No chat channel found',
};

type GetChatChannelReq = {
  channel_id: number;
  chain_id: string;
};

type GetChatChannelResp = ChatChannelAttributes;

export default async (
  models: DB,
  req: TypedRequestQuery<GetChatChannelReq>,
  res: TypedResponse<GetChatChannelResp>,
) => {
  if (!req.query.channel_id) {
    throw new AppError(Errors.NoChannelId);
  }
  if (!req.query.chain_id) {
    throw new AppError(Errors.NoChainId);
  }

  await checkReadPermitted(
    models,
    req.query.chain_id,
    Action.VIEW_CHAT_CHANNELS,
    req.user?.id,
  );

  const channel = await models.ChatChannel.findOne({
    where: {
      id: req.query.channel_id,
    },
  });

  if (!channel) {
    throw new AppError(Errors.ChannelNF);
  }

  return success(res, channel.toJSON());
};
