/* eslint-disable no-restricted-syntax */
import { default as $ } from 'jquery';
import { default as _ } from 'lodash';

import { NotificationStore } from 'stores';
import { NotificationSubscription, Notification } from 'models';
import app from 'state';

const post = (route, args, callback) => {
  args['jwt'] = app.login.jwt;
  return $.post(app.serverUrl() + route, args).then((resp) => {
    if (resp.status === 'Success') {
      callback(resp.result);
    } else {
      console.error(resp);
    }
  }).catch((e) => console.error(e));
};

class NotificationsController {
  private _store: NotificationStore = new NotificationStore();
  public get store() { return this._store; }
  public get notifications(): Notification[] { return this._store.getAll(); }

  private _subscriptions: NotificationSubscription[] = [];
  public get subscriptions() { return this._subscriptions; }

  public constructor() {
    // do nothing
  }

  public subscribe(category: string, objectId: string) {
    const subscription = this.subscriptions.find((v) => v.category === category && v.objectId === objectId);
    if (subscription) {
      return this.enableSubscriptions([subscription]);
    } else {
      return post('/createSubscription', {
        'category': category, 'object_id': objectId, 'is_active': true
      }, (result) => {
        const newSubscription = NotificationSubscription.fromJSON(result);
        this._subscriptions.push(newSubscription);
      });
    }
  }

  public enableSubscriptions(subscriptions: NotificationSubscription[]) {
    return post('/enableSubscriptions', {
      'subscription_ids[]': subscriptions.map((n) => n.id),
    }, (result) => {
      for (const s of subscriptions) {
        s.enable();
      }
    });
  }

  public disableSubscriptions(subscriptions: NotificationSubscription[]) {
    return post('/disableSubscriptions', {
      'subscription_ids[]': subscriptions.map((n) => n.id),
    }, (result) => {
      for (const s of subscriptions) {
        s.disable();
      }
    });
  }

  public deleteSubscription(subscription: NotificationSubscription) {
    return post('/deleteSubscription', {
      'subscription_id': subscription.id,
    }, (result) => {
      const idx = this._subscriptions.indexOf(subscription);
      if (idx === -1) {
        throw new Error('subscription not found!');
      }
      this._subscriptions.splice(idx, 1);
    });
  }

  public markAsRead(notifications: Notification[]) {
    return post('/markNotificationsRead', {
      'notification_ids[]': notifications.map((n) => n.id),
    }, (result) => {
      for (const n of notifications.filter((n) => !n.isRead)) {
        n.markRead();
      }
    });
  }

  public clearAllRead() {
    return post('/clearReadNotifications', { }, (result) => {
      const toClear = this._store.getAll().filter((n) => n.isRead);
      for (const n of toClear) {
        this._store.remove(n);
      }
    });
  }

  public update(n: Notification) {
    this._store.add(n);
  }

  public refresh() {
    if (!app.login || !app.login.jwt) {
      throw new Error('must be logged in to refresh notifications');
    }
    return post('/viewNotifications', { }, (result) => {
      this._store.clear();
      this._subscriptions = [];
      for (const subscriptionJSON of result) {
        const subscription = NotificationSubscription.fromJSON(subscriptionJSON);
        this._subscriptions.push(subscription);
        for (const notificationJSON of subscriptionJSON.Notifications) {
          const notification = Notification.fromJSON(notificationJSON, subscription);
          this._store.add(notification);
        }
      }
    });
  }
}

export default NotificationsController;
