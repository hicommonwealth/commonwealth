import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { GetCommunitiesReq, GetCommunitiesResp } from 'common-common/src/api/extApiTypes';
import { formatPaginationNoSort } from 'server/util/queries';
import { AppError } from 'server/util/errors';

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
  if(network) where = { network: network };

  let communities, count;
  if (!count_only) {
    ({ rows: communities, count } = await models.Chain.findAndCountAll({
      where: where,
      ...formatPaginationNoSort(req.query)
    }));
  } else {
    count = await models.Chain.count({
      where: where,
      ...formatPaginationNoSort(req.query)
    });
  }

  return success(res, { communities: communities, count });
};

export default getCommunities;
