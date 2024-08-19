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
  const { with_contest_managers } = req.query;

  const topics = await controllers.topics.getTopics({
    community: community!,
    with_contest_managers: with_contest_managers === 'true',
  });

  return success(res, topics);
};
