import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { CommentAttributes } from '../../models/comment';
import { IPagination } from '../../util/queries';

type GetCommentsReq = {
  community_id?: string;
  thread_id?: number;
  profile_id?: string;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

type GetThreadsResp = CommentAttributes[];

const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {


  const comments = await models.Comment.findAll({
    where,
    include: [ models.Address, models.Attachment ],
    order: [['created_at', 'DESC']],
  });
  return success(res, [...comments.map((c) => c.toJSON() )]);
};

export default getComments;
