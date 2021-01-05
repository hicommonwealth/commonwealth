import { Request, Response, NextFunction } from 'express';
import lookupCommunityIsVisibleToUser from '../util/lookupCommunityIsVisibleToUser';
import { factory, formatFilename } from '../../shared/logging';

const log = factory.getLogger(formatFilename(__filename));

const getThread = async (models, req: Request, res: Response, next: NextFunction) => {
  const [chain, community] = await lookupCommunityIsVisibleToUser(models, req.query, req.user, next);

  let thread;
  let collaboration;
  try {
    thread = await models.OffchainThread.findOne({
      where: {
        id: req.query.id,
      },
      include: [
        models.Address,
        { model: models.Address, through: models.SharingPermission, as: 'collaborator' },
        { model: models.OffchainTopic, as: 'topic' },
      ]
    });
    // collaboration = await models.SharingPermission.findAll({
    //   where: {
    //     thread_id: req.body.id
    //   },
    //   include: [
    //     { model: models.Address },
    //     { model: models.OffchainThread }
    //   ]
    // });
  } catch (e) {
    console.log(e);
  }

  // console.log({collaboration});
  console.log({thread});

  return thread
    ? res.json({ status: 'Success', result: thread.toJSON() })
    : res.json({ status: 'Failure' });
};

export default getThread;
