import { query, validationResult } from 'express-validator';
import Sequelize, { WhereOptions } from 'sequelize';
import type { GetReactionsReq, GetReactionsResp } from '../../api/extApiTypes';
import type { DB } from '../../models';
import { ReactionAttributes } from '../../models/reaction';
import type { TypedRequestQuery, TypedResponse } from '../../types';
import { failure, success } from '../../types';
import { paginationValidation } from '../../util/helperValidations';
import { flattenIncludedAddresses, formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getReactionsValidation = [
  query('community_id').isString().trim(),
  query('thread_id').optional().toInt(),
  query('comment_id').optional().toInt(),
  query('address_ids').optional().toArray(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
  ...paginationValidation,
];

const getReactions = async (
  models: DB,
  req: TypedRequestQuery<GetReactionsReq>,
  res: TypedResponse<GetReactionsResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }
  const { community_id, comment_id, addresses, count_only } = req.query;

  const where: WhereOptions<ReactionAttributes> = { community_id };
  if (comment_id) where.comment_id = comment_id;

  // if address is included, find which addressIds they correspond to.
  if (addresses) {
    const addressIds = await models.Address.findAll({
      where: { address: { [Op.in]: addresses } },
      attributes: ['id'],
    });

    where.address_id = { [Op.in]: addressIds.map((p) => p.id) };
  }

  const include = [
    {
      model: models.Address,
      attributes: ['address'],
      required: true,
    },
  ];

  const pagination = formatPagination(req.query);

  let reactions, count;

  if (!count_only) {
    ({ rows: reactions, count } = await models.Reaction.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['address_id'] },
      ...pagination,
    }));
  } else {
    count = await models.Reaction.count({
      where,
      include,
      attributes: { exclude: ['address_id'] },
      ...pagination,
    });
  }

  flattenIncludedAddresses(reactions);

  return success(res, { reactions, count });
};

export default getReactions;
