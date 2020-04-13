import { Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { UserRequest } from '../types';

const bulkThreads = async (models, req: UserRequest, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  const threads = await models.OffchainThread.findAll({
    where: community ? { community: community.id }
      : chain ? { chain: chain.id } : {},
    include: [
      models.Address,
      {
        model: models.OffchainTag,
        as: 'tags',
        through: {
          model: models.TaggedThread,
          as: 'taggedThreads',
        },
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return res.json({ status: 'Success', result: threads.map((c) => c.toJSON()) });
};

export default bulkThreads;
