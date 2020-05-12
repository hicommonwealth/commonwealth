import moment from 'moment-twitter';
import NotificationSubscription from './NotificationSubscription';
import ChainEvent from './ChainEvent';

class Notification {
  public readonly id: number;
  public readonly data: string;
  public readonly createdAt: moment.Moment;
  public readonly subscription: NotificationSubscription;
  public readonly chainEvent?: ChainEvent;

  private _isRead: boolean;
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

  public static fromJSON(json, subscription: NotificationSubscription) {
    return new Notification(
      json.id,
      json.notification_data,
      json.is_read,
      json.created_at,
      subscription,
      json.ChainEvent ? ChainEvent.fromJSON(json.ChainEvent) : undefined,
    );
  }
}

export default Notification;
