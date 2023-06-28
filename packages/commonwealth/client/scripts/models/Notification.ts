import moment from 'moment';
import ChainEvent from './ChainEvent';
import type NotificationSubscription from './NotificationSubscription';

export class Notification {
  public readonly id: number;
  public readonly data: string;
  public readonly createdAt: moment.Moment;
  public readonly subscription?: NotificationSubscription;
  public readonly chainEvent?: ChainEvent;

  constructor(id, data, createdAt, subscription, chainEvent?) {
    this.id = id;
    this.data = data;
    this.createdAt = moment(createdAt);
    this.subscription = subscription;
    this.chainEvent = chainEvent;
  }

  public static fromJSON(json, subscription: NotificationSubscription) {
    return new Notification(
      json.notification_id,
      json.notification_data,
      json.notification_created_at,
      subscription,
      json.category_id === 'chain-event'
        ? ChainEvent.fromJSON(json.notification_data)
        : undefined
    );
  }
}

export default Notification;
