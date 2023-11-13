import type {
  GetCommunitiesReq,
  GetCommunitiesResp,
} from 'common-common/src/api/extApiTypes';
import { needParamErrMsg } from 'common-common/src/api/extApiTypes';
import { oneOf, query, validationResult } from 'express-validator';
import { formatPaginationNoSort } from '../../util/queries';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { success, failure } from '../../types';
import type { DB } from '../../models';
import { paginationValidation } from '../../util/helperValidations';

export const getCommunitiesValidation = [
  oneOf(
    [
      query('community_id').exists().isString().trim(),
      query('network').exists().isString().trim(),
      query('comment_id').exists().toInt(),
      query('address_ids').exists().toArray(),
      query('addresses').exists().toArray(),
    ],
    `${needParamErrMsg} (community_id, network, comment_id, address_ids, addresses)`
  ),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
];

const getCommunities = async (
  models: DB,
  req: TypedRequestQuery<GetCommunitiesReq>,
  res: TypedResponse<GetCommunitiesResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }
  const { community_id, network, count_only } = req.query;

  let where;
  if (community_id) where = { id: community_id };
  if (network) where = { network };

  let communities, count;
  if (!count_only) {
    ({ rows: communities, count } = await models.Community.findAndCountAll({
      where,
      ...formatPaginationNoSort(req.query),
    }));
  } else {
    count = await models.Community.count({
      where,
      ...formatPaginationNoSort(req.query),
    });
  }

  return success(res, { communities, count });
};

export default getCommunities;
