/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import _ from 'lodash';

import { NotificationStore } from 'stores';
import { NotificationSubscription, Notification } from 'models';
import app from 'state';

const post = (route, args, callback) => {
  args['jwt'] = app.user.jwt;
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

  public subscribe(category: string, objectId: string) {
    const subscription = this.subscriptions.find((v) => v.category === category && v.objectId === objectId);
    if (subscription) {
      return this.enableSubscriptions([subscription]);
    } else {
      // TODO: Change to POST /subscription
      return post('/createSubscription', {
        'category': category, 'object_id': objectId, 'is_active': true
      }, (result) => {
        const newSubscription = NotificationSubscription.fromJSON(result);
        this._subscriptions.push(newSubscription);
      });
    }
  }

  public enableSubscriptions(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /subscriptions
    return post('/enableSubscriptions', {
      'subscription_ids[]': subscriptions.map((n) => n.id),
    }, (result) => {
      for (const s of subscriptions) {
        s.enable();
      }
    });
  }

  public disableSubscriptions(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /subscriptions
    return post('/disableSubscriptions', {
      'subscription_ids[]': subscriptions.map((n) => n.id),
    }, (result) => {
      for (const s of subscriptions) {
        s.disable();
      }
    });
  }

  public enableImmediateEmails(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /immediateEmails
    return post('/enableImmediateEmails', {
      'subscription_ids[]': subscriptions.map((n) => n.id),
    }, (result) => {
      for (const s of subscriptions) {
        s.enableImmediateEmail();
      }
    });
  }

  public disableImmediateEmails(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /immediateEmails
    return post('/disableImmediateEmails', {
      'subscription_ids[]': subscriptions.map((n) => n.id),
    }, (result) => {
      for (const s of subscriptions) {
        s.disableImmediateEmail();
      }
    });
  }

  public deleteSubscription(subscription: NotificationSubscription) {
    // TODO: Change to DELETE /subscription
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
    // TODO: Change to PUT /notificationsRead
    return post('/markNotificationsRead', {
      'notification_ids[]': notifications.map((n) => n.id),
    }, (result) => {
      for (const n of notifications.filter((notif) => !notif.isRead)) {
        n.markRead();
      }
    });
  }

  public clearAllRead() {
    // TODO: Change to DELETE /notificationsRead (combine with mark route)
    return post('/clearReadNotifications', { }, (result) => {
      const toClear = this._store.getAll().filter((n) => n.isRead);
      for (const n of toClear) {
        this._store.remove(n);
      }
    });
  }

  public clear(notifications: Notification[]) {
    // TODO: Decide REST API handling
    return post('/clearNotifications', {
      'notification_ids[]': notifications.map((n) => n.id),
    }, async (result) => {
      for (const n of notifications) {
        await this._store.remove(n);
      }
    });
  }

  public update(n: Notification) {
    if (!this._store.getById(n.id)) {
      this._store.add(n);
    }
  }

  public refresh() {
    if (!app.user || !app.user.jwt) {
      throw new Error('must be logged in to refresh notifications');
    }
    // TODO: Change to GET /notifications
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
