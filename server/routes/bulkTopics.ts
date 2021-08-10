import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import log from '../../shared/logging';
import { DB } from '../database';

export const Errors = { };

const bulkTopics = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));

  const topics = await models.OffchainTopic.findAll({
    where: community
      ? { community_id: community.id }
      : { chain_id: chain.id },
  });

  return res.json({ status: 'Success', result: topics.map((c) => c.toJSON()) });
};

export default bulkTopics;
