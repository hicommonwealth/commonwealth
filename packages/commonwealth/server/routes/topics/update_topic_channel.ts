import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

type UpdateTopicChannelRequestParams = {
  topicId: string;
  channelId: string;
};

type UpdateTopicChannelResponse = void;

export const updateTopicChannelHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<UpdateTopicChannelRequestParams>,
  res: TypedResponse<UpdateTopicChannelResponse>
) => {
  const { user, chain } = req;
  const { topicId, channelId } = req.params;

  await controllers.topics.updateTopicChannel({
    user,
    chain,
    topicId: parseInt(topicId, 10),
    channelId,
  });

  return success(res, null);
};
