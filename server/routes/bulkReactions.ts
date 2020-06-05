import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const bulkReactions = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  let reactions;
  try {
    reactions = await models.OffchainReaction.findAll({
      where: community
        ? { community: community.id }
        : { chain: chain.id },
      include: [ models.Address ],
      order: [['created_at', 'DESC']],
    });
  } catch (err) {
    return next(new Error(err));
  }

  return res.json({ status: 'Success', result: reactions.map((c) => c.toJSON()) });
};

export default bulkReactions;
