import moment from 'moment-twitter';
import NotificationSubscription from './NotificationSubscription';

class Notification {
  public readonly id: number;
  public readonly data: string;
  public readonly createdAt: moment.Moment;
  public readonly subscription: NotificationSubscription;

  private _isRead: boolean;
  public get isRead(): boolean {
    return this._isRead;
  }

  constructor(id, data, isRead, createdAt, subscription) {
    this.id = id;
    this.data = data;
    this._isRead = isRead;
    this.createdAt = moment(createdAt);
    this.subscription = subscription;
  }
  public markRead() {
    if (this._isRead) {
      throw new Error('notification already read!');
    } else {
      this._isRead = true;
    }
  }
  public static fromJSON(json, subscription: NotificationSubscription) {
    return new Notification(json.id, json.notification_data, json.is_read, json.created_at, subscription);
  }
}

export default Notification;
