import { TopicAttributes } from '../../models/topic';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type DeleteTopicRequestParams = {
  topicId: string;
};
type DeleteTopicRequestBody = Partial<TopicAttributes>;

type DeleteTopicResponse = void;

export const deleteTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<DeleteTopicRequestBody, any, DeleteTopicRequestParams>,
  res: TypedResponse<DeleteTopicResponse>
) => {
  const { user, chain } = req;
  const { topicId } = req.params;

  await controllers.topics.deleteTopic({
    user,
    chain,
    topicId: parseInt(topicId, 10),
  });

  return success(res, null);
};
