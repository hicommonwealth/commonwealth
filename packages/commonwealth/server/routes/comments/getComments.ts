import { AppError } from '../../util/errors';
import Sequelize from 'sequelize';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { GetCommentsReq, GetCommentsResp } from 'common-common/src/api/extApiTypes';
import { formatPagination } from 'server/util/queries';
import { check, query, validationResult } from 'express-validator';

const { Op } = Sequelize;

const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetCommentsResp>,
) => {
  query('community_id').isString().trim();
  query('address').optional().isString();
  query('count_only').optional().toBoolean();

  const { community_id, addresses, count_only } = req.query;

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
      where: where,
      include: include,
      ...formatPagination(req.query)
    }));
  } else{
    count = <any>await models.Comment.count({
      where: where,
      include: include,
      ...formatPagination(req.query)
    });
  }

  return success(res, { comments: comments, count });
};

export default getComments;
