import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser, { ChainCommunityError } from '../util/lookupCommunityIsVisibleToUser';

const getThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user);
  if (!chain && !community) return next(new Error(ChainCommunityError));

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
