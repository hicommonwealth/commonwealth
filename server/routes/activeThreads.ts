import { Request, Response, NextFunction } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { OffchainCommentAttributes } from 'server/models/offchain_comment';
import {
  OffchainThreadAttributes,
  OffchainThreadInstance,
} from 'server/models/offchain_thread';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';

const activeThreads = async (
  models: DB,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const [chain, error] = await lookupCommunityIsVisibleToUser(
    models,
    req.query,
    req.user
  );
  if (error) return next(new Error(error));
  const { cutoff_date } = req.query;

  const whereOptions: WhereOptions<OffchainCommentAttributes> = {};
  if (cutoff_date) {
    whereOptions.created_at = { [Op.gt]: cutoff_date };
  }

  whereOptions.chain = chain.id;
  whereOptions.root_id = { [Op.like]: 'discussion%' };

  const comments = await models.OffchainComment.findAll({
    where: whereOptions,
    include: [models.Address],
    order: [['created_at', 'DESC']],
  });

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
  // if (community) threadWhereOptions['community'] = community.id;
  const threads: OffchainThreadInstance[] = await models.OffchainThread.findAll(
    {
      where: threadWhereOptions,
      include: [
        { model: models.Address, as: 'Address' },
        { model: models.OffchainTopic, as: 'topic' },
      ],
      order: [['created_at', 'DESC']],
    }
  );

  const activitySummary = {};
  threadIds.forEach((id) => {
    activitySummary[id] = {
      lastUpdated: comments.find((c) => c.root_id === `discussion_${id}`)
        ?.created_at,
      commentCount: comments.filter((c) => c.root_id === `discussion_${id}`)
        ?.length,
    };
  });

  return res.json({
    status: 'Success',
    result: {
      activitySummary,
      threads: threads.map((c) => c.toJSON()),
    },
  });
};

export default activeThreads;
