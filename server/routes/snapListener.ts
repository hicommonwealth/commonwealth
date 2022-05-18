import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';
import { success } from '../types';
import { NotificationCategories, ProposalType, ChainType } from '../../shared/types';
import { USERS } from 'construct-ui/lib/esm/components/icon/generated/IconNames';
import { Test } from 'mocha';

const snapListener = async (models: DB, req: Request, res: Response, next: NextFunction) => {

  const chainsToNotify = await models.Chain.findAll({
    attributes: ['id'],
    where: {
      snapshot: [req.body.space]
    },
   });
  // Don't forget this is an array
  console.log(chainsToNotify[0]);

  // TODO: Figure out how to log the amount of times the listener is pinged

  // Check that the space is one we care about
  if (!chainsToNotify && !chainsToNotify.length) {
    // TODO: log that this was an unnecessary ping
    return success(res, "Snapshot POST Recieved, Space not present");
  }

  await chainsToNotify.forEach(async function (e) {
    // call Subscription.emitNotifications here
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.NewSnapshot,
      // using the id snapshot sends with the event
      // this is the right thing but  may need to be altered so the link works
      `snapshot-${req.body.id}`,
      {
        created_at: new Date(),
        chain_id: e.id,
        snapshotEventType: req.body.event,
      }
    );
  });

  // TODO: Log that the listener was pinged for a valid space
  return success(res, "Snapshot POST recieved, Space present");
};

export default snapListener;

  // Testing
  // try {
  //   await models.User.create({
  //     id: 9999999,
  //     email: 'jahniksuriya@gmail.com',
  //     emailVerified: true,
  //     emailNotificationInterval: 'daily',
  //     isAdmin: true,
  //     lastVisited: '{}',
  //     disableRichText: false,
  //   });

  //   console.log("Test User Created");

  //   await models.Subscription.create({
  //     id: 9999999,
  //     subscriber_id: 9999999,
  //     category_id: "new-snapshot",
  //     object_id: "snapshot-/hash",
  //     is_active: true,
  //     immediate_email: true,
  //     chain_id: 'lyra',
  //     offchain_thread_id: null,
  //     offchain_comment_id: null,
  //     chain_event_type_id: null,
  //     chain_entity_id: null,
  //   });

  //   console.log("Test Subscription Created");

  // } catch (e) {
  //   console.log(e);
  // }