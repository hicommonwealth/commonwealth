import Sequelize from 'sequelize';
import { GetCommentsReq, GetCommentsResp } from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import { Action } from 'common-common/src/permissions';
import { TypedRequestQuery, TypedResponse, success, failure } from '../../types';
import { DB } from '../../models';
import { checkReadPermitted } from '../../util/roles';
import { formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getCommentsValidation = [
  query('community_id').isString().trim(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean()
];

export const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetCommentsResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const { community_id, addresses, count_only } = req.query;

  try{
    await checkReadPermitted(
      models,
      req.query.community_id,
      Action.VIEW_REACTIONS,
      req.user?.id
  );
  } catch (err) {
    return failure(res.status(403), err);
  }

  const where = { chain: community_id };

  const include = [];
  if (addresses) include.push({
    model: models.Address,
    where: { address: { [Op.in]: addresses } },
    required: true
  });

  let comments, count;
  if (!count_only) {
    ({ rows: comments, count } = await models.Comment.findAndCountAll({
      where,
      include,
      ...formatPagination(req.query)
    }));
  } else {
    count = await models.Comment.count({
      where,
      include,
      ...formatPagination(req.query)
    });
  }

  return success(res, { comments, count });
};
