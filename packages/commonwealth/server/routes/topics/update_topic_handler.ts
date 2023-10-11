import { TopicAttributes } from '../../models/topic';
import { ServerControllers } from '../../routing/router';
import { TypedResponse, success } from '../../types';

type CreateTopicRequestBody = Partial<TopicAttributes>;

type UpdateTopicResponse = TopicAttributes;

export const updateTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateTopicRequestBody>,
  res: TypedResponse<UpdateTopicResponse>
) => {
  const { user, chain, body } = req;

  const topic = await controllers.topics.updateTopic({ user, chain, body });

  return success(res, topic);
};
