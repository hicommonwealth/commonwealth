import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { Response, NextFunction } from 'express';
import { UserRequest } from '../types';

const bulkComments = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  const comments = await models.OffchainComment.findAll({
    where: community
      ? { community: community.id }
      : { chain: chain.id },
    include: [ models.Address, models.OffchainAttachment ],
    order: [['created_at', 'DESC']],
  });

  return res.json({ status: 'Success', result: comments.map((c) => c.toJSON()) });
};

export default bulkComments;
