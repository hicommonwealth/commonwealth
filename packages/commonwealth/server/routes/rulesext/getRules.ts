import Sequelize from 'sequelize';
import { GetRulesReq, GetRulesResp } from 'common-common/src/api/extApiTypes';
import { oneOf, query, validationResult } from 'express-validator';
import { TypedRequestQuery, TypedResponse, success, failure } from '../../types';
import { DB } from '../../models';
import { formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getRulesValidation = [
  oneOf([
    query('community_id').exists().isString().trim(),
    query('ids').exists().toArray(),
  ]),
  query('count_only').optional().isBoolean().toBoolean()
];

export const getRules = async (
  models: DB,
  req: TypedRequestQuery<GetRulesReq>,
  res: TypedResponse<GetRulesResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community_id, ids, count_only } = req.query;

  const where = {};

  if (community_id) where['chain_id'] = community_id;
  if (ids) where['id'] = { [Op.in]: ids };

  let rules, count;
  if (!count_only) {
    ({ rows: rules, count } = await models.Rule.findAndCountAll({
      where,
      ...formatPagination(req.query)
    }));
  } else {
    count = <any>await models.Rule.count({
      where,
      ...formatPagination(req.query)
    });
  }

  return success(res, { rules, count });
};