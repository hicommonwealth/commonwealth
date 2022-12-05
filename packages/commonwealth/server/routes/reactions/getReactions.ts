import Sequelize, {} from 'sequelize';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { formatPagination } from 'server/util/queries';
import { GetReactionsReq, GetReactionsResp, IPagination } from 'common-common/src/api/extApiTypes';

const { Op } = Sequelize;

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
      where: where,
      include,
      ...pagination
    }
  );

  return success(res, { reactions: reactions.map((c) => c.toJSON()), count });
};

export default getReactions;
