import { NotificationCategory } from '@hicommonwealth/shared';
import moment from 'moment';
import ChainEvent from './ChainEvent';

export class Notification {
  public readonly id: number;
  public readonly categoryId: NotificationCategory;
  public readonly data: string;
  public readonly createdAt: moment.Moment;

  public readonly subscriptionId: number;
  public readonly chainEvent?: ChainEvent;
  private _isRead?: boolean;

  public get isRead(): boolean {
    return this._isRead;
  }

  constructor(
    id: number,
    categoryId: NotificationCategory,
    data: string,
    isRead: boolean,
    createdAt: string,
    subscriptionId: number,
    chainEvent?,
  ) {
    this.id = id;
    this.categoryId = categoryId;
    this.data = data;
    this._isRead = !!isRead;
    this.createdAt = moment(createdAt);
    this.subscriptionId = subscriptionId;
    this.chainEvent = chainEvent;
  }

  public markRead() {
    if (this._isRead) {
      throw new Error('notification already read!');
    } else {
      this._isRead = true;
    }
  }

  public static fromJSON(json) {
    return new Notification(
      json.id,
      json.category_id,
      json.notification_data,
      json.is_read,
      json.created_at,
      json.subscription_id,
      json?.ChainEvent ? ChainEvent.fromJSON(json.ChainEvent) : undefined,
    );
  }
}

export default Notification;
