import { TopicAttributes } from '../../models/topic';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

type UpdateTopicsOrderRequestBody = {
  orderIds: string[];
};

type UpdateTopicsOrderResponse = TopicAttributes[];

export const updateTopicsOrderHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<UpdateTopicsOrderRequestBody>,
  res: TypedResponse<UpdateTopicsOrderResponse>
) => {
  const { user, chain, body } = req;

  const topics = await controllers.topics.updateTopicsOrder({
    user,
    chain,
    body,
  });

  return success(res, topics);
};
