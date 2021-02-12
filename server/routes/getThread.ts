import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';

const getThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const communityResult = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (typeof communityResult === 'string') return next(new Error(communityResult));
  const [chain, community] = communityResult;

  let thread;
  try {
    thread = await models.OffchainThread.findOne({
      where: {
        id: req.query.id,
      },
      include: [
        {
          model: models.Address,
          as: 'Address'
        },
        {
          model: models.Address,
          through: models.Collaboration,
          as: 'collaborators'
        },
        {
          model: models.OffchainTopic,
          as: 'topic'
        },
      ],
    });
  } catch (e) {
    console.log(e);
  }

  return thread
    ? res.json({ status: 'Success', result: thread.toJSON() })
    : res.json({ status: 'Failure' });
};

export default getThread;
