import { AppError } from 'common-common/src/errors';
import { Action } from '../../../shared/permissions';
import type { DB } from '../../models';
import type { ChatChannelAttributes } from '../../models/chat_channel';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { success } from '../../types';
import { checkReadPermitted } from '../../util/roles';

export const Errors = {
  NoCommunityId: 'No community id given',
};

type GetChatMessagesReq = {
  chain_id: string;
};

type GetChatMessagesResp = ChatChannelAttributes[];

export default async (
  models: DB,
  req: TypedRequestQuery<GetChatMessagesReq>,
  res: TypedResponse<GetChatMessagesResp>
) => {
  if (!req.query.chain_id) {
    throw new AppError(Errors.NoCommunityId);
  }

  await checkReadPermitted(
    models,
    req.query.chain_id,
    Action.VIEW_CHAT_CHANNELS,
    req.user?.id
  );

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

  return success(
    res,
    messages.map((m) => m.toJSON())
  );
};
