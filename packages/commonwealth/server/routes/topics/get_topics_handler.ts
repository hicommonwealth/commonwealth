import { TopicAttributes } from '@hicommonwealth/model';
import { Request } from 'express';
import { ServerControllers } from '../../routing/router';
import { TypedResponse, success } from '../../types';

type GetTopicsResponse = TopicAttributes[];

export const getTopicsHandler = async (
  controllers: ServerControllers,
  req: Request,
  res: TypedResponse<GetTopicsResponse>,
) => {
  const { community } = req;

  const topics = await controllers.topics.getTopics({ community });

  return success(res, topics);
};
