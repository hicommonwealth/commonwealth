import { TopicAttributes } from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type UpdateTopicsOrderRequestBody = {
  orderedIds: string[];
};

type UpdateTopicsOrderResponse = TopicAttributes[];

export const updateTopicsOrderHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateTopicsOrderRequestBody>,
  res: TypedResponse<UpdateTopicsOrderResponse>,
) => {
  const { user, community, body } = req;

  const topics = await controllers.topics.updateTopicsOrder({
    user,
    community,
    body,
  });

  return success(res, topics);
};
