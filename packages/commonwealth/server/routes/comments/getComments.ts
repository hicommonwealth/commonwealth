import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import Sequelize from 'sequelize';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { CommentAttributes } from '../../models/comment';
import { GetCommentsResp, IPagination } from 'common-common/src/api/extApiTypes';
import { formatPagination } from 'server/util/queries';

const { Op } = Sequelize;

type GetCommentsReq = {
  community_id: string;
  addresses?: string[];
  count_only?: boolean;
} & IPagination;

const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetCommentsResp>,
) => {
  const { community_id, addresses, count_only } = req.query;

  const where = { chain: community_id };

  const include = [];
  if (addresses) include.push({
    model: models.Address,
    where: { address: { [Op.in]: addresses }},
    required: true
  });

  // if (count_only) //TODO: finish;

  const { rows: comments, count } = await models.Comment.findAndCountAll({
    where: where,
    include: include,
    ...formatPagination(req.query)
  });

  return success(res, { comments: comments.map((c) => c.toJSON()), count });
};

export default getComments;
