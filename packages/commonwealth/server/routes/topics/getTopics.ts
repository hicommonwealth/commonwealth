import { GetTopicsReq, GetTopicsResp } from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import { TypedRequestQuery, TypedResponse, success, failure } from '../../types';
import { DB } from '../../models';
import { formatPagination } from '../../util/queries';

export const getTopicsValidation = [
  query('community_id').isString().trim(),
  query('count_only').optional().isBoolean().toBoolean()
];

export const getTopics = async (
  models: DB,
  req: TypedRequestQuery<GetTopicsReq>,
  res: TypedResponse<GetTopicsResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community_id, count_only } = req.query;

  const where = { chain_id: community_id };

  let topics, count;
  if (!count_only) {
    ({ rows: topics, count } = await models.Topic.findAndCountAll({
      where,
      ...formatPagination(req.query)
    }));
  } else {
    count = <any>await models.Topic.count({
      where,
      ...formatPagination(req.query)
    });
  }

  return success(res, { topics, count });
};