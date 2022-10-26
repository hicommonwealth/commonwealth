import Sequelize, {  } from 'sequelize';
import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ThreadAttributes } from '../../models/thread';
import { formatPagination, IPagination, orderBy } from '../../util/queries';
const { Op, Model } = Sequelize;


type GetThreadsReq = {
  community_id: string;
  topic_id?: number;
  address_ids?: string[];
  no_body?: boolean;
  include_comments?: boolean;
} & IPagination;

export const Errors = {
  NoArgs: "Must provide arguments",
  NoCommunityId: "Must provide a Community_id"
};


type GetThreadsResp = { threads: ThreadAttributes[], count: number };

const getThreads = async (
  models: DB,
  req: TypedRequestQuery<GetThreadsReq>,
  res: TypedResponse<GetThreadsResp>,
) => {
  if (!req.query) throw new AppError(Errors.NoArgs);

  const { community_id, topic_id, address_ids, no_body, include_comments } = req.query;
  if (!community_id) throw new AppError(Errors.NoCommunityId)

  const pagination = formatPagination(req.query);
  const order = req.query.sort ? orderBy('createdAt', req.query.sort) : {};

  const where = { chain: community_id };
  const include: any[] = [];
  let attributes;

  if (no_body) attributes = { exclude: ['body', 'plaintext', 'version_history']}
  if (topic_id) where['topic_id'] = topic_id;
  if (address_ids) where['address_id'] = { [Op.in]: address_ids, };
  if (include_comments) include.push({ model: models.Comment, required: false, });

  const { rows: threads, count } = await models.Thread.findAndCountAll({
    where,
    include,
    attributes,
    ...pagination,
    ...order
  })

  return success(res, {threads: threads.map((t) => t.toJSON()), count});
};

export default getThreads;
