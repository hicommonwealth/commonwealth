import Sequelize, {} from 'sequelize';
import { query } from 'express-validator';
import { GetReactionsReq, GetReactionsResp } from 'common-common/src/api/extApiTypes';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { formatPagination } from '../../util/queries';

const { Op } = Sequelize;

export const getThreadsValidation = [
  query('community_id').isString().trim(),
  query('topic_id').optional().isNumeric(),
  query('count_only').optional().isBoolean().toBoolean(),
  query('address_ids').optional().toArray(),
  query('addresses').optional().toArray(),
  query('no_body').optional().isBoolean().toBoolean(),
  query('include_comments').optional().isBoolean().toBoolean(),
  query('count_only').optional().isBoolean().toBoolean(),
];

const getReactions = async (
  models: DB,
  req: TypedRequestQuery<GetReactionsReq>,
  res: TypedResponse<GetReactionsResp>,
) => {
  const { community_id, comment_id, addresses, count_only } = req.query;

  const where = { chain: community_id };

  const include = [];
  if (addresses) include.push({
    model: models.Address,
    where: { address: { [Op.in]: addresses } },
    required: true
  });

  const pagination = formatPagination(req.query);

  const { rows: reactions, count } = await models.Reaction.findAndCountAll({
      where,
      include,
      ...pagination
    }
  );

  return success(res, { reactions: reactions.map((c) => c.toJSON()), count });
};

export default getReactions;
