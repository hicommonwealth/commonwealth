import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../util/logging';
const log = factory.getLogger(formatFilename(__filename));

const bulkTags = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  if (!chain && !community) return next(new Error('Tags must be called for a chain or community'));
  const tags = await models.OffchainTag.findAll({
    where: community
      ? { community_id: community.id }
      : { chain_id: chain.id },
  });

  return res.json({ status: 'Success', result: tags.map((c) => c.toJSON()) });
};

export default bulkTags;
