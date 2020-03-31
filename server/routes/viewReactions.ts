import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const viewReactions = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  if (!req.query.object_id) {
    return next(new Error('Must provide object_id'));
  }

  const reactions = await models.OffchainReaction.findAll({
    where: community ?
      { community: community.id, object_id: req.query.object_id } :
      { chain: chain.id, object_id: req.query.object_id },
    include: [ models.Address ],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: reactions.map((c) => c.toJSON()) });
};

export default viewReactions;
