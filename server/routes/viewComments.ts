import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const viewComments = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  if (!req.query.root_id) {
    return next(new Error('Must provide root_id'));
  }

  const comments = await models.OffchainComment.findAll({
    where: community
      ? { community: community.id, root_id: req.query.root_id }
      : { chain: chain.id, root_id: req.query.root_id },
    include: [ models.Address, models.OffchainAttachment ],
    order: [['created_at', 'DESC']],
  });
  return res.json({ status: 'Success', result: comments.map((c) => c.toJSON()) });
};

export default viewComments;
