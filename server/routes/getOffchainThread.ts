import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getOffchainThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const { Op } = models.sequelize;
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  const thread = await models.OffchainThread.findOne({
    where: {
      id: req.query.id,
    },
    include: [ models.Address, { model: models.OffchainTopic, as: 'topic' } ]
  });

  return res.json({ status: 'Success', result: thread.toJSON() });
};

export default getOffchainThread;
