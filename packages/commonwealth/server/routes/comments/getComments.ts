import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import Sequelize, {  } from 'sequelize';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { CommentAttributes } from '../../models/comment';
import { IPagination } from '../../util/queries';
const { Op } = Sequelize;

type GetCommentsReq = {
  community_id: string;
  thread_id?: number;
  profile_id?: string;
  address_ids?: string[];
  count_only?: boolean;
} & IPagination;

type GetThreadsResp = CommentAttributes[];

const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {
  const { community_id, thread_id, profile_id, address_ids, count_only } = req.query;

  // const thread = await models.Threads

  const where = { chain: community_id };
  const include: any[] = [];

  if (thread_id) where['root_id'] = thread_id;
  if (profile_id) where['topic_id'] = `discussion_${thread_id}`;
  if (address_ids) where['address_ids'] = { [Op.in]: address_ids, };
  if (count_only) include.push({ model: models.Comment, required: false, });

  const comments = await models.Comment.findAll({
    where: where,
    include: [ models.Address, models.Attachment ],
    order: [['created_at', 'DESC']],
  });
  return success(res, [...comments.map((c) => c.toJSON() )]);
};

export default getComments;
