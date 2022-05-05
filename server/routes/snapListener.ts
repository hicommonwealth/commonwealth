import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';
import { success } from '../types';
import { NotificationCategories, ProposalType, ChainType } from '../../shared/types';

const snapListener = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  console.log(req.body);
  console.log(req.body.space);

  // TODO: Change this query to simply ensure that the snapshot in question is one we care about
  const chainsToNotify = await models.Chain.findAll({ where : {snapshot : [req.body.space] } });
  console.log(chainsToNotify);

  // TODO: Figure out how to log the amount of times the listener is pinged
  //       as well as how often the pings are actually ones we care about

  // call Subscription.emitNotifications here

  await models.Subscription.emitNotifications(
    models,
    NotificationCategories.NewSnapshot,
    // Will probably need to change the object_id to something else
    // but for now just using the id snapshot sends with the event
    `snapshot-${req.body.id}`,
    {
      created_at: new Date(),
      category_id: 'new-snapshot',
      snapshotEventType: req.body.event,
    }
  );

  return success(res, "TODO, figure out what to put here");
};

export default snapListener;