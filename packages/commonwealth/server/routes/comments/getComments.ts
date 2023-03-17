import type {
  GetCommentsReq,
  GetCommentsResp,
} from 'common-common/src/api/extApiTypes';
import { query, validationResult } from 'express-validator';
import Sequelize from 'sequelize';
import type { DB } from '../../models';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { paginationValidation } from '../../util/helperValidations';
import { flattenIncludedAddresses, formatPagination } from '../../util/queries';

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

  // if address is included, find which addressIds they correspond to.
  if (addresses) {
    const addressIds = await models.Address.findAll({
      where: { address: { [Op.in]: addresses } },
      attributes: ['id'],
    });

    where['address_id'] = { [Op.in]: addressIds.map((p) => p.id) };
  }

  const include = [
    {
      model: models.Address,
      attributes: ['address'],
      required: true,
    },
  ];

  let comments, count;
  if (!count_only) {
    ({ rows: comments, count } = await models.Comment.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['address_id'] },
      ...formatPagination(req.query),
    }));
  } else {
    count = await models.Comment.count({
      where,
      include,
      attributes: { exclude: ['address_id'] },
      ...formatPagination(req.query),
    });
  }

  flattenIncludedAddresses(comments);

  return success(res, { comments, count });
};
