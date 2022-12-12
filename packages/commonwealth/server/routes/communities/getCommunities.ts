import { GetCommunitiesReq, GetCommunitiesResp } from 'common-common/src/api/extApiTypes';
import { formatPaginationNoSort } from '../../util/queries';
import { AppError } from '../../util/errors';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';

export const Errors = {
  NoArgs: "Must provide community_id or network",
  BothArgs: "Must not provide both args"
};

const getCommunities = async (
  models: DB,
  req: TypedRequestQuery<GetCommunitiesReq>,
  res: TypedResponse<GetCommunitiesResp>,
) => {
  const { community_id, network, count_only } = req.query;

  if (!community_id && !network) throw new AppError(Errors.NoArgs);
  if (community_id && network) throw new AppError(Errors.BothArgs);

  let where;
  if(community_id) where = { id: community_id };
  if(network) where = { network };

  let communities, count;
  if (!count_only) {
    ({ rows: communities, count } = await models.Chain.findAndCountAll({
      where,
      ...formatPaginationNoSort(req.query)
    }));
  } else {
    count = await models.Chain.count({
      where,
      ...formatPaginationNoSort(req.query)
    });
  }

  return success(res, { communities, count });
};

export default getCommunities;
