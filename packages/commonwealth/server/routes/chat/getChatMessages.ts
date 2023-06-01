import { AppError } from 'common-common/src/errors';
import type { DB } from '../../models';
import type { ChatChannelAttributes } from '../../models/chat_channel';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { success } from '../../types';

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
