import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { CommentAttributes } from '../../models/comment';
import { IPagination } from '../../util/queries';

type GetCommentsReq = {
  community_id: string;
  thread_id?: number;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

type GetThreadsResp = CommentAttributes[];

const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {
  return success(res, []);
};

export default getComments;
