import type Notification from '../models/Notification';
import type NotificationSubscription from '../models/NotificationSubscription';
import IdStore from './IdStore';

class NotificationStore extends IdStore<Notification> {
  private _storeSubscription: { [subscriptionId: number]: Notification } = {};

  public add(n: Notification) {
    super.add(n);
    this._storeSubscription[n.subscriptionId] = n;
    return this;
  }

  public remove(n: Notification) {
    super.remove(n);
    delete this._storeSubscription[n.subscriptionId];
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
