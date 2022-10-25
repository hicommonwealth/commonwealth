import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ChainAttributes } from '../../models/chain';
import { IPagination } from '../../util/queries';

type GetCommunitiesReq = {
  community_id?: string;
  count_only?: boolean; // Desired?
} & IPagination;

type GetCommunitiesResp = ChainAttributes[];

const getCommunities = async (
  models: DB,
  req: TypedRequestQuery<GetCommunitiesReq>,
  res: TypedResponse<GetCommunitiesResp>,
) => {
  return success(res, []);
};

export default getCommunities;
