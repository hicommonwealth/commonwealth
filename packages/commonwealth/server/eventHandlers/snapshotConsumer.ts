import amqp, { Message } from 'amqplib/callback_api';
import { NotificationCategories } from 'common-common/src/types';
import { MixpanelSnapshotEvents } from '../../shared/analytics/types';
import DB from '../database';
import SnapshotSpaceCache from '../util/snapshotSpaceCache';
import { mixpanelTrack } from '../util/mixpanelUtil';

type SnapshotEvent = {
  id: string;
  event: string;
  space: string;
  expire: number;
};

const snapshotListener = async (
  models: typeof DB,
  cache: SnapshotSpaceCache,
  event: SnapshotEvent,
) => {

  const chainsToNotify = await cache.checkChainsToNotify(event.space);

  if (!chainsToNotify.length) {
    mixpanelTrack({
      event: MixpanelSnapshotEvents.SNAPSHOT_INVALID_SPACE,
      isCustomDomain: false,
      space: event.space
    });
  }

  chainsToNotify.forEach(async (chain: string) => {
    // Send out notifications
    const notification = await models.Subscription.emitNotifications(
      models,
      NotificationCategories.NewSnapshot,
      // using the id snapshot sends with the event
      // this may need to be altered so the link works
      `snapshot-${event.id}`, {
        created_at: new Date(),
        chain_id: chain,
        snapshot_id: event.id,
        snapshotEventType: event.event,
      }
    );

    console.log({ notification })
  });

  // Log that the listener was pinged for a valid space
  mixpanelTrack({
    event: MixpanelSnapshotEvents.SNAPSHOT_VALID_SPACE,
    isCustomDomain: false,
    space: event.space
  });

  console.log('Snapshot event stored: ', event);
};


const createMQConsumer = (amqpURl: string, queueName: string) => {
  const snapshotSpaceCache = new SnapshotSpaceCache(DB);

  return () => {
    amqp.connect(amqpURl, (errConn, conn) => {
      if (errConn) {
        throw errConn;
      }

      conn.createChannel((errChan, chan) => {
        if (errChan) {
          throw errChan;
        }

        console.log('Consumer connected to queue: ', queueName);
        chan.assertQueue(queueName, { durable: true });

        chan.consume(
          queueName,
          (msg: Message | null) => {
              const snapshotEvent: SnapshotEvent = JSON.parse(msg.content.toString());
              console.log({ snapshotEvent })
              console.log({ queueName })

              snapshotListener(
                DB,
                snapshotSpaceCache,
                snapshotEvent
              );
          },
          { noAck: true }
        );
      });
    });
  };
};

export default createMQConsumer;
