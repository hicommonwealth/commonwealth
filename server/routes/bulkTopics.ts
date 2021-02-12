import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser, { ChainCommunityError } from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = { };

const bulkTopics = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (!chain && !community) return next(new Error(ChainCommunityError));

  const topics = await models.OffchainTopic.findAll({
    where: community
      ? { community_id: community.id }
      : { chain_id: chain.id },
  });

  return res.json({ status: 'Success', result: topics.map((c) => c.toJSON()) });
};

export default bulkTopics;
