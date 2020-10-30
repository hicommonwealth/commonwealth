import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  let thread;
  try {
    thread = await models.OffchainThread.findOne({
      where: {
        id: req.query.id,
      },
      include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ]
    });
  } catch (e) {
    console.log(e);
  }

  console.log(thread);

  return res.json({ status: 'Success', result: thread.toJSON() });
};

export default getThread;
