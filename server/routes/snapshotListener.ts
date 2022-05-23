import { Request, Response, NextFunction } from 'express';
import { USERS } from 'construct-ui/lib/esm/components/icon/generated/IconNames';
import { Test } from 'mocha';
import { MixpanelSnapshotEvents } from 'shared/analytics/types';
import { DB } from '../database';
import { success } from '../types';
import SnapshotSpaceCache from '../util/snapshotSpaceCache';
import { mixpanelTrack } from '../util/mixpanelUtil';
import { NotificationCategories } from '../../shared/types';


const snapshotListener = async (
  models: DB, cache: SnapshotSpaceCache, req: Request, res: Response, next: NextFunction
  ) => {

  // Check cache to see if this is a space we care about
  const validSnapshot = await cache.check(req.body.space);

  if (!validSnapshot) {
    mixpanelTrack({
      event: MixpanelSnapshotEvents.SNAPSHOT_INVALID_SPACE,
      isCustomDomain: false,
      space: req.body.space
    });
    return success(res, "Snapshot POST Recieved, Space not present");
  }

  const chainsToNotify = await models.Chain.findAll({
    attributes: ['id'],
    where: {
      snapshot: [req.body.space]
    },
   });

  // TODO: Figure out how to log the amount of times the listener is pinged
  // mixpanel track

  await chainsToNotify.forEach(async (e) => {
    // Send out notifications
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
  mixpanelTrack({
    event: MixpanelSnapshotEvents.SNAPSHOT_VALID_SPACE,
    isCustomDomain: false,
    space: req.body.space
  });
  return success(res, "Snapshot POST recieved, Space present");
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