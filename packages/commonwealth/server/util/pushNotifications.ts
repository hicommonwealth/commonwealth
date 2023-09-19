import { DeliveryMechanismAttributes } from 'server/models/delivery_mechanisms';
import admin from 'firebase-admin';
import { DB } from 'server/models';
import * as serviceAccount from '../../../commonwealth/serviceAccountKey.json';
import { NotificationCategories } from '../../../common-common/src/types';
import {
  IChainEventNotificationData,
  IForumNotificationData,
  ISnapshotNotificationData,
  NotificationDataTypes,
} from '../../shared/types';
import { getForumNotificationCopy } from '../scripts/emails';
import { CWEvent, Label as ChainEventLabel } from 'chain-events/src';
import { capitalize } from 'lodash';
import { SERVER_URL } from '../../server/config';

// This controller needs to be moved
export class FirebaseController {
  private static instance: FirebaseController = new FirebaseController();

  private _messaging: admin.messaging.Messaging;

  private constructor() {
    const creds = admin.credential.cert(serviceAccount as admin.ServiceAccount);

    admin.initializeApp({
      credential: creds,
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });

    this._messaging = admin.messaging();
  }

  public static getMessaging(): admin.messaging.Messaging {
    return this.instance._messaging;
  }
}

const firebase = FirebaseController.getMessaging();

/* Needs to be refactored for sure: essentially copy past from scripts/email */
export async function createNotificationMessage(
  notificationData: NotificationDataTypes,
  category_id,
  models
): Promise<{ title: string; body: string; data: any }> {
  if (
    (<IChainEventNotificationData>notificationData).block_number &&
    (<IChainEventNotificationData>notificationData).event_data
  ) {
    const ceInstance = <IChainEventNotificationData>notificationData;

    const evt: CWEvent = {
      blockNumber: ceInstance.block_number,
      data: ceInstance.event_data,
      network: ceInstance.network,
    };

    const chainEventLabel = ChainEventLabel(ceInstance.chain, evt);
    if (!chainEventLabel) return;

    const title = `${process.env.NODE_ENV !== 'production' ? '[dev] ' : ''}${
      chainEventLabel.heading
    } event on ${capitalize(ceInstance.chain)}`;

    return {
      title: title,
      body: `View this notification on Commonwealth.`,
      data: {
        path: null /* To update when we have a feed */,
      },
    };
  } else if (
    category_id !== NotificationCategories.NewReaction &&
    category_id !== NotificationCategories.ThreadEdit
  ) {
    const [
      emailSubjectLine,
      ,
      actionCopy,
      objectCopy,
      communityCopy,
      excerpt,
      proposalPath,
      authorPath,
    ] = await getForumNotificationCopy(
      models,
      notificationData as IForumNotificationData,
      category_id
    );

    return {
      title: `${emailSubjectLine} ${communityCopy}`,
      body: `${excerpt}`,
      data: {
        proposalPath,
        authorPath,
        excerpt,
      },
    };
  }
}

export async function sendPushNotification(
  deliveryMechanism: DeliveryMechanismAttributes,
  notificationData: NotificationDataTypes,
  category_id: string,
  models: DB
) {
  console.log('Preparing to send push notification...');
  const token = deliveryMechanism.identifier;

  // Prepare notification payload
  const message = await createNotificationMessage(
    notificationData,
    category_id,
    models
  );

  /* Need to update this for deeplinks */
  let link = message.data.proposalPath;
  if (
    deliveryMechanism.type === 'android' ||
    deliveryMechanism.type === 'ios-native'
  ) {
    link = link.replace('http://localhost:8080/', `capacitor://${SERVER_URL}/`);
    link = link.replace(
      'https://commonwealth.im/',
      `capacitor://${SERVER_URL}`
    );
  }

  const payload = {
    notification: {
      title: message.title,
      body: message.body,
      // additional fields specific to your mobile platform (e.g., "badge" for iOS or "icon" for Android)
    },
    // data: {
    //   title: message.title,
    //   body: message.body,
    //   link: message.data.proposalPath ? message.data.proposalPath : null,
    // }, // add back later for deeplinks
    token: token,
  };
  console.log('Payload:', payload);

  switch (deliveryMechanism.type) {
    case 'browser':
    case 'ios-pwa':
    case 'android':
      // Send push notification to both mobile and web using FCM
      try {
        if (token) {
          const response = await firebase.send(payload);
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
      break;
    case 'desktop':
      try {
        if (token) {
          const response = await firebase.send(payload);
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
      break;
    default:
      console.error(
        `Unsupported delivery mechanism type: ${deliveryMechanism.type}`
      );
  }
}
