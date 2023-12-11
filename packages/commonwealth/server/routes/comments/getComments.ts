import { query, validationResult } from 'express-validator';
import Sequelize, { WhereOptions } from 'sequelize';
import type { GetCommentsReq, GetCommentsResp } from '../../api/extApiTypes';
import type { DB } from '../../models';
import { AddressAttributes } from '../../models/address';
import { CommentAttributes } from '../../models/comment';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { paginationValidation } from '../../util/helperValidations';
import { flattenIncludedAddresses, formatPagination } from '../../util/queries';
import { attributesOf } from '../../util/sequelizeHelpers';

const { Op } = Sequelize;

export const getCommentsValidation = [
  query('community_id').isString().trim(),
  query('addresses').optional().toArray(),
  query('thread_ids').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
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

  const { community_id, addresses, thread_ids, count_only } = req.query;

  const where: WhereOptions<CommentAttributes> = { chain: community_id };

  // if address is included, find which addressIds they correspond to.
  if (addresses) {
    const addressIds = await models.Address.findAll({
      where: { address: { [Op.in]: addresses } },
      attributes: attributesOf<AddressAttributes>('id'),
    });

    where['address_id'] = { [Op.in]: addressIds.map((p) => p.id) };
  }

  if (thread_ids) {
    where['thread_id'] = { [Op.in]: thread_ids };
  }

  const include = [
    {
      model: models.Address,
      attributes: attributesOf<AddressAttributes>('address'),
      required: true,
    },
  ];

  let comments, count;
  if (!count_only) {
    ({ rows: comments, count } = await models.Comment.findAndCountAll({
      where,
      include,
      attributes: { exclude: attributesOf<CommentAttributes>('address_id') },
      ...formatPagination(req.query),
    }));
  } else {
    count = await models.Comment.count({
      logging: console.log,
      where,
      include,
      attributes: { exclude: attributesOf<CommentAttributes>('address_id') },
      ...formatPagination(req.query),
    });
  }

  if (comments) {
    flattenIncludedAddresses(comments);
  }

  return success(res, { comments, count });
};
