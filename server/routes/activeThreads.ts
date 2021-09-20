import { Request, Response, NextFunction } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { OffchainCommentAttributes } from 'server/models/offchain_comment';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
import { DB } from '../database';
import { OffchainThreadAttributes, OffchainThreadInstance } from 'server/models/offchain_thread';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = {
  MutuallyExclusive:
    'Cannot select mutually exclusive offchain threads and proposals only options',
};

const activeThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(
    models,
    req.query,
    req.user
  );
  if (error) return next(new Error(error));
  const { offchain_threads_only, proposals_only, cutoff_date } = req.query;
  const include_threads = req.query.include_threads === 't';

  if (offchain_threads_only && proposals_only) {
    return next(new Error(Errors.MutuallyExclusive));
  }
  const whereOptions: WhereOptions<OffchainCommentAttributes> = {};
  if (cutoff_date) {
    whereOptions.created_at = { [Op.gt]: cutoff_date };
  }
  if (community) {
    whereOptions.community = community.id;
  } else {
    whereOptions.chain = chain.id;
    if (offchain_threads_only) {
      whereOptions.root_id = { [Op.like]: 'discussion%' };
    } else if (proposals_only) {
      whereOptions.root_id = { [Op.notLike]: 'discussion%' };
    }
  }
  const comments = await models.OffchainComment.findAll({
    where: whereOptions,
    include: [models.Address, models.OffchainAttachment],
    order: [['created_at', 'DESC']],
  });

  let threads: OffchainThreadInstance[];
  if (include_threads) {
    const threadIds = comments.map((c) => {
      return c.root_id.split('_')[1];
    });
    const threadWhereOptions: WhereOptions<OffchainThreadAttributes> = {
      [Op.or]: [
        { id: { [Op.in]: threadIds } },
        { created_at: { [Op.gt]: cutoff_date } },
      ],
    };
    if (chain) threadWhereOptions['chain'] = chain.id;
    if (community) threadWhereOptions['community'] = community.id;
    threads = await models.OffchainThread.findAll({
      where: threadWhereOptions,
      include: [
        { model: models.Address, as: 'Address' },
        models.OffchainAttachment,
        { model: models.OffchainTopic, as: 'topic' },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  return res.json({
    status: 'Success',
    result: include_threads
      ? {
          comments: comments.map((c) => c.toJSON()),
          threads: threads.map((c) => c.toJSON()),
        }
      : comments.map((c) => c.toJSON()),
  });
};

export default activeThreads;
