import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ThreadAttributes } from '../../models/thread';
import { IPagination } from '../../util/queries';


type GetThreadsReq = {
  community_id: string;
  topic_id?: number;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

type GetThreadsResp = ThreadAttributes[];

const getThreads = async (
  models: DB,
  req: TypedRequestQuery<GetThreadsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {
  return success(res, []);
};

export default getThreads;
