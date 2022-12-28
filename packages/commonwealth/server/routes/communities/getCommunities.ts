import { GetCommunitiesReq, GetCommunitiesResp } from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import { formatPaginationNoSort } from '../../util/queries';
import { TypedRequestQuery, TypedResponse, success, failure } from '../../types';
import { DB } from '../../models';

export const getCommunitiesValidation = [
  query('community_id').optional().exists().isString().trim(),
  query('network').optional().exists().isString().trim(),
  query('comment_id').optional().exists().toInt(),
  query('address_ids').optional().exists().toArray(),
  query('addresses').optional().exists().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
  query('is_active').optional().isBoolean().toBoolean(),
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
  const { community_id, network, is_active, count_only } = req.query;

  let where = {};
  if (community_id) where['id'] = community_id;
  if (network) where = { network };
  if (is_active) where['active'] = true;

  let communities, count;
  if (!count_only) {
    communities = await models.Chain.findAll({
      where,
      ...formatPaginationNoSort(req.query)
    });
  } else {
    count = await models.Chain.count({
      where,
      ...formatPaginationNoSort(req.query)
    });
  }

  return success(res, { communities, count });
};

export default getCommunities;
