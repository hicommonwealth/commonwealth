import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ReactionAttributes } from '../../models/reaction';

type GetReactionReq = {
  community_id: string;
  thread_id?: number;
  comment_id?: number;
  addresses?: string[];

  // TODO: goes in pagination helper
  limit?: number;
  page?: string;
  sort?: string;
  count_only?: boolean;
};

type GetReactionsResp = ReactionAttributes[];

const getReactions = async (
  models: DB,
  req: TypedRequestQuery<GetReactionReq>,
  res: TypedResponse<GetReactionsResp>,
) => {
  return success(res, []);
};

export default getReactions;
