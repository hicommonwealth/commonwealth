import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ThreadAttributes } from '../../models/thread';

type GetThreadsReq = {
  community_id: string;
  topic_id?: number;
  addresses?: string[];

  // TODO: goes in pagination helper
  limit?: number;
  page?: string;
  sort?: string;
  count_only?: boolean;
};

type GetThreadsResp = ThreadAttributes[];

const getThreads = async (
  models: DB,
  req: TypedRequestQuery<GetThreadsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {
  return success(res, []);
};

export default getThreads;
