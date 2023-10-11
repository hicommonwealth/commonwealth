import { TopicAttributes } from '../../models/topic';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type CreateTopicRequestBody = Partial<TopicAttributes>;

type CreateTopicResponse = TopicAttributes;

export const createTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateTopicRequestBody>,
  res: TypedResponse<CreateTopicResponse>
) => {
  const { user, chain, body } = req;

  const topic = await controllers.topics.createTopic({ user, chain, body });

  return success(res, topic);
};
