import { Request, Response, NextFunction } from 'express';
import { TypedRequestBody, TypedResponse, success } from '../types';
import { MixpanelSnapshotEvents } from '../../shared/analytics/types';
import { DB } from '../database';
import SnapshotSpaceCache from '../util/snapshotSpaceCache';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { NotificationCategories } from '../../shared/types';
import { NotificationInstance } from '../models/notification'

/* NOTES FOR QA

To spoof a POST request to the listener:
Send POST to http://localhost:8080/api/snapHook with the following as the raw JSON body:

  {
    "id":"proposal/QmZ21uS8tVucpaNq2LZCbZUmHhYYXunC1ZS2gPDNWwPWD9",
    "event":"proposal/created",   <- three other options: proposal/start, proposal/end, proposal/deleted
    "space":"yam.eth",           <- snapshot space name goes here
    "expire":1620947058
  }

Only chain linked to more than one snapshot space:
    - 'hummingbot-foundation' => [ 'hbot.eth', 'hbot-ip.eth', 'hbot-prp.eth' ]
No issues with it so far, but could be useful for testing edge cases

Chains with non-standard formatting in the DB:
    - 'exodia' => [ 'https://snapshot.org/#/exodiadao.eth' ]
    - 'element-finance' => [ 'https://snapshot.org/#/elfi.eth' ]
These won't work unless snapshot sends us the exact url abovce in the POST request, which I
dont think they will do. I assume this is the user error entering the entire url rather than
just the space
  Ex: a POST with "space":"elfi.eth" won't work, only "space":"https://snapshot.org/#/elfi.eth" will work

*/

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

  // DEPRECATED: Build array of notifications to emit from array of chains to notify
  // const notificationObjects = chainsToNotify.map((chain:string): NotificationInstance => {
  //   const notification = models.Notification.build({
  //     notification_data: JSON.stringify({
  //       created_at: new Date(),
  //       chain_id: chain,
  //       snapshotEventType: req.body.event,
  //     }),
  //     category_id: NotificationCategories.NewSnapshot,
  //     chain_id: chain
  //   });
  //   return notification;
  // });

  // Temporarily emit all notifications in one step by iteratiting over each chain to notify
  // calling the DB in a loop is bad practice, but in this case chainsToNotify
  // will never have more than one element since no two space are subscribed to the same chain
  // IMPORTANT TODO:
  //    - Add a snapshot_id column to Subscription table and edit subscription.emitNotifications
  //      to not require chain_id for snapshot notifications so notifications can be grouped by
  //      snapshot space and not by chain

  chainsToNotify.forEach(async (e) => {
    // Send out notifications
    await models.Subscription.emitNotifications(
      models,
      NotificationCategories.NewSnapshot,
      // using the id snapshot sends with the event
      // this may need to be altered so the link works
      `snapshot-${req.body.id}`,
      {
        created_at: new Date(),
        chain_id: e,
        snapshotEventType: req.body.event,
      }
    );
  });

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


  // 1. Get subscribers to send notifications to

  // 2. bulk create notification instances for each chain_id

  // 3. map into array all the notificationReads for each subscriber on each chain_id

  // 4. bulk create notificationReads

  // 5. create msg formats and send immediate emails

  // 6. ping webhooks? (not sure if this is necessary we don't expose this as an option in the UI yet)



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