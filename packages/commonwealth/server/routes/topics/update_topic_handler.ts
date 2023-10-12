import { TopicAttributes } from '../../models/topic';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type UpdateTopicRequestBody = Partial<TopicAttributes>;

type UpdateTopicResponse = TopicAttributes;

export const updateTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateTopicRequestBody>,
  res: TypedResponse<UpdateTopicResponse>
) => {
  const { user, chain, body } = req;

  const topic = await controllers.topics.updateTopic({ user, chain, body });

  return success(res, topic);
};
