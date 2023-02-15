import type { ChainEventType } from 'models/index';
import moment from 'moment';
import ChainEvent from './ChainEvent';
import type NotificationSubscription from './NotificationSubscription';

class Notification {
  public readonly id: number;
  public readonly data: string;
  public readonly createdAt: moment.Moment;
  public readonly subscription?: NotificationSubscription;
  public readonly chainEvent?: ChainEvent;
  private _isRead?: boolean;

  public get isRead(): boolean {
    return this._isRead;
  }

  constructor(id, data, isRead, createdAt, subscription, chainEvent?) {
    this.id = id;
    this.data = data;
    this._isRead = !!isRead;
    this.createdAt = moment(createdAt);
    this.subscription = subscription;
    this.chainEvent = chainEvent;
  }

  public markRead() {
    if (this._isRead) {
      throw new Error('notification already read!');
    } else {
      this._isRead = true;
    }
  }

  public static fromJSON(
    json,
    subscription: NotificationSubscription,
    chainEventType?: ChainEventType
  ) {
    return new Notification(
      json.id,
      json.notification_data,
      json.is_read,
      json.created_at,
      subscription,
      json?.ChainEvent
        ? ChainEvent.fromJSON(json.ChainEvent, chainEventType)
        : undefined
    );
  }
}

export default Notification;
