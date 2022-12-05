import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { GetCommunitiesReq, GetCommunitiesResp } from 'common-common/src/api/extApiTypes';
import { formatPagination } from 'server/util/queries';

const getCommunities = async (
  models: DB,
  req: TypedRequestQuery<GetCommunitiesReq>,
  res: TypedResponse<GetCommunitiesResp>,
) => {
  return success(res, []);
};

export default getCommunities;
