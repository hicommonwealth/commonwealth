import Sequelize from 'sequelize';
import type {
  GetCommentsReq,
  GetCommentsResp,
} from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { success, failure } from '../../types';
import type { DB } from '../../models';
import { formatPagination } from '../../util/queries';
import { paginationValidation } from '../../util/helperValidations';

const { Op } = Sequelize;

export const getCommentsValidation = [
  query('community_id').isString().trim(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
];

export const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetCommentsResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community_id, addresses, count_only } = req.query;

  const where = { chain: community_id };

  const include = [];
  if (addresses)
    include.push({
      model: models.Address,
      where: { address: { [Op.in]: addresses } },
      required: true,
    });

  let comments, count;
  if (!count_only) {
    ({ rows: comments, count } = await models.Comment.findAndCountAll({
      where,
      include,
      ...formatPagination(req.query),
    }));
  } else {
    count = await models.Comment.count({
      where,
      include,
      ...formatPagination(req.query),
    });
  }

  return success(res, { comments, count });
};
