import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ReactionAttributes } from '../../models/reaction';
import { IPagination } from 'server/util/queries';

type GetReactionReq = {
  community_id: string;
  thread_id?: number;
  comment_id?: number;
  addresses?: string[];
} & IPagination;

type GetReactionsResp = ReactionAttributes[];

const getReactions = async (
  models: DB,
  req: TypedRequestQuery<GetReactionReq>,
  res: TypedResponse<GetReactionsResp>,
) => {
  const { community_id, thread_id, comment_id, addresses} = req.query;

  const where = { chain: community_id };
  const include: any[] = [];
  let attributes;

  // if (no_body) attributes = { exclude: ['body', 'plaintext', 'version_history']}
  // if (topic_id) where['topic_id'] = topic_id;
  // if (address_ids) where['address_id'] = { [Op.in]: address_ids, };
  // if (include_comments) include.push({ model: models.Comment, required: false, });

  return success(res, []);
};

export default getReactions;
