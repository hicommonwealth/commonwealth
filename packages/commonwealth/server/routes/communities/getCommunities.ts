import { GetCommunitiesReq, GetCommunitiesResp } from 'common-common/src/api/extApiTypes';
import { query, validationResult } from "express-validator";
import { formatPaginationNoSort } from '../../util/queries';
import { TypedRequestQuery, TypedResponse, success, failure } from '../../types';
import { DB } from '../../models';

export const getCommunitiesValidation = [
  query('community_id').isString().trim(),
  query('network').optional().isString(),
  query('comment_id').optional().toInt(),
  query('address_ids').optional().toArray(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
];

const getCommunities = async (
  models: DB,
  req: TypedRequestQuery<GetCommunitiesReq>,
  res: TypedResponse<GetCommunitiesResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }
  const { community_id, network, count_only } = req.query;

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
