import Sequelize from 'sequelize';
import { query, validationResult } from 'express-validator';
import {
  GetReactionsReq,
  GetReactionsResp,
} from 'common-common/src/api/extApiTypes';
import {
  TypedRequestQuery,
  TypedResponse,
  success,
  failure,
} from '../../types';
import { DB } from '../../models';
import { formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getReactionsValidation = [
  query('community_id').isString().trim(),
  query('thread_id').optional().toInt(),
  query('comment_id').optional().toInt(),
  query('address_ids').optional().toArray(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean(),
];

const getReactions = async (
  models: DB,
  req: TypedRequestQuery<GetReactionsReq>,
  res: TypedResponse<GetReactionsResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }
  const { community_id, comment_id, addresses, count_only } = req.query;

  const where = { chain: community_id };

  const include = [];
  if (addresses)
    include.push({
      model: models.Address,
      where: { address: { [Op.in]: addresses } },
      required: true,
    });

  const pagination = formatPagination(req.query);

  const { rows: reactions, count } = await models.Reaction.findAndCountAll({
    where,
    include,
    ...pagination,
  });

  return success(res, { reactions: reactions.map((c) => c.toJSON()), count });
};

export default getReactions;
