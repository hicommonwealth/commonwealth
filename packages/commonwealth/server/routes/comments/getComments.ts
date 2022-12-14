import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { CommentAttributes } from '../../models/comment';

type GetCommentsReq = {
  community_id: string;
  thread_id?: number;
  addresses?: string[];

  // TODO: goes in pagination helper
  limit?: number;
  page?: string;
  sort?: string;
  count_only?: boolean;
};

type GetThreadsResp = CommentAttributes[];

const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {
  return success(res, []);
};

export default getComments;
