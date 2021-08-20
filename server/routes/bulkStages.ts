import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { DB } from '../database';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

export const Errors = { };

const bulkStages = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  const [chain, community, error] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (error) return next(new Error(error));

  const stages = await models.OffchainStage.findAll({
    where: community
      ? { community_id: community.id }
      : { chain_id: chain.id },
  });

  return res.json({ status: 'Success', result: stages.map((c) => c.toJSON()) });
};

export default bulkStages;
