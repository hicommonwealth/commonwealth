import IdStore from './IdStore';
import {NotificationSubscription, Notification } from '../models';

class NotificationStore extends IdStore<Notification> {
  private _storeSubscription: { [subscriptionId: number]: Notification } = {};

  public add(n: Notification) {
    super.add(n);
    this._storeSubscription[n.subscription.id] = n;
    return this;
  }

  public remove(n: Notification) {
    super.remove(n);
    delete this._storeSubscription[n.subscription.id];
    return this;
  }

  public clear() {
    super.clear();
    this._storeSubscription = {};
  }

  public getBySubscription(subscription: NotificationSubscription) {
    return this._storeSubscription[subscription.id];
  }
}

export default NotificationStore;
