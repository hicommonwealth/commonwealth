import { Request, Response, NextFunction } from 'express';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { MixpanelSnapshotEvents } from '../../shared/analytics/types';
import { DB } from '../database';
import SnapshotSpaceCache from '../util/snapshotSpaceCache';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { NotificationCategories } from '../../shared/types';
import { NotificationInstance } from '../models/notification'


type SnapshotListenerReq = {
  id: string;
  event: string;
  space: string;
  expire: number;
};

type SnapshotListenerResp = string;

const snapshotListener = async (
  models: DB,
  cache: SnapshotSpaceCache,
  req: TypedRequestBody<SnapshotListenerReq>,
  res: TypedResponse<SnapshotListenerResp>,
) => {

  // Check cache to see if any chains are subscribed to this space
  // returns an array of the chains that subscribe to that space or an empty array
  const chainsToNotify = await cache.checkChainsToNotify(req.body.space);

  // If the array is empty, log that the listener was pinged for a invalid space
  if (!chainsToNotify.length) {
    mixpanelTrack({
      event: MixpanelSnapshotEvents.SNAPSHOT_INVALID_SPACE,
      isCustomDomain: false,
      space: req.body.space
    });
    return success(res, "Snapshot POST Recieved, Space not present");
  }

  // Build array of notifications to emit from array of chains to notify
  const notificationObjects = chainsToNotify.map((chain:string): NotificationInstance => {
    const notification = models.Notification.build({
      notification_data: JSON.stringify({
        created_at: new Date(),
        chain_id: chain,
        snapshotEventType: req.body.event,
      }),
      category_id: NotificationCategories.NewSnapshot,
      chain_id: chain
    });
    return notification;
  });

  // TODO: We now have an array of NotificationInstances, figure out how to bulk emit them
  // NB: will potentially have to save them to db before emitting
  //     also figure out where object id goes

  // DEPRECATED: Old method of emitting notifications in one step using a loop
  // Still works but isnt good because it hits the db in a loop
  //
  // await chainsToNotify.forEach(async (e) => {
  //   // Send out notifications
  //   await models.Subscription.emitNotifications(
  //     models,
  //     NotificationCategories.NewSnapshot,
  //     // using the id snapshot sends with the event
  //     // this is the right thing but  may need to be altered so the link works
  //     `snapshot-${req.body.id}`,
  //     {
  //       created_at: new Date(),
  //       chain_id: e,
  //       snapshotEventType: req.body.event,
  //     }
  //   );
  // });
  //

  // Log that the listener was pinged for a valid space
  mixpanelTrack({
    event: MixpanelSnapshotEvents.SNAPSHOT_VALID_SPACE,
    isCustomDomain: false,
    space: req.body.space
  });

  try {
    return success(res, "Snapshot POST recieved, Space present");
  } catch(e) {
    return e;
  }

};

export default snapshotListener;

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

  // const chainsToNotify = await models.Chain.findAll({
  //   attributes: ['id'],
  //   where: {
  //     snapshot: [req.body.space]
  //   },
  //  });