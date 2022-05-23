/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import m from 'mithril';

import { NotificationStore } from 'stores';
import { NotificationSubscription, Notification, ChainEventType } from 'models';
import app from 'state';

const post = (route, args, callback) => {
  args['jwt'] = app.user.jwt;
  return $.post(app.serverUrl() + route, args)
    .then((resp) => {
      if (resp.status === 'Success') {
        callback(resp.result);
      } else {
        console.error(resp);
      }
    })
    .catch((e) => console.error(e));
};

class NotificationsController {
  private _store: NotificationStore = new NotificationStore();

  private maxReadId: number = 0;
  private maxUnreadId: number = 0;

  public get store() {
    return this._store;
  }

  public get notifications(): Notification[] {
    return this._store.getAll();
  }

  private _subscriptions: NotificationSubscription[] = [];
  public get subscriptions() {
    return this._subscriptions;
  }

  public subscribe(category: string, objectId: string) {
    const subscription = this.subscriptions.find(
      (v) => v.category === category && v.objectId === objectId
    );
    if (subscription) {
      return this.enableSubscriptions([subscription]);
    } else {
      // TODO: Change to POST /subscription
      return post(
        '/createSubscription',
        {
          category,
          object_id: objectId,
          is_active: true,
        },
        (result) => {
          const newSubscription = NotificationSubscription.fromJSON(result);
          if (newSubscription.category === 'chain-event')
            app.socket.chainEventsNs.addChainEventSubscriptions([
              newSubscription,
            ]);
          this._subscriptions.push(newSubscription);
        }
      );
    }
  }

  public enableSubscriptions(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /subscriptions
    return post(
      '/enableSubscriptions',
      {
        'subscription_ids[]': subscriptions.map((n) => n.id),
      },
      (result) => {
        const ceSubs = [];
        for (const s of subscriptions) {
          s.enable();
          if (s.category === 'chain-event') ceSubs.push(s);
        }
        app.socket.chainEventsNs.addChainEventSubscriptions(ceSubs);
      }
    );
  }

  public disableSubscriptions(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /subscriptions
    return post(
      '/disableSubscriptions',
      {
        'subscription_ids[]': subscriptions.map((n) => n.id),
      },
      (result) => {
        const ceSubs = [];
        for (const s of subscriptions) {
          s.disable();
          if (s.category === 'chain-event') ceSubs.push(s);
        }
        app.socket.chainEventsNs.deleteChainEventSubscriptions(ceSubs);
      }
    );
  }

  public enableImmediateEmails(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /immediateEmails
    return post(
      '/enableImmediateEmails',
      {
        'subscription_ids[]': subscriptions.map((n) => n.id),
      },
      (result) => {
        for (const s of subscriptions) {
          s.enableImmediateEmail();
        }
      }
    );
  }

  public disableImmediateEmails(subscriptions: NotificationSubscription[]) {
    // TODO: Change to PUT /immediateEmails
    return post(
      '/disableImmediateEmails',
      {
        'subscription_ids[]': subscriptions.map((n) => n.id),
      },
      (result) => {
        for (const s of subscriptions) {
          s.disableImmediateEmail();
        }
      }
    );
  }

  public deleteSubscription(subscription: NotificationSubscription) {
    // TODO: Change to DELETE /subscription
    return post(
      '/deleteSubscription',
      {
        subscription_id: subscription.id,
      },
      (result) => {
        const idx = this._subscriptions.indexOf(subscription);
        if (idx === -1) {
          throw new Error('subscription not found!');
        }
        this._subscriptions.splice(idx, 1);
        if (subscription.category === 'chain-event')
          app.socket.chainEventsNs.deleteChainEventSubscriptions([
            subscription,
          ]);
      }
    );
  }

  public markAsRead(notifications: Notification[]) {
    // TODO: Change to PUT /notificationsRead
    const MAX_NOTIFICATIONS_READ = 100; // mark up to 100 notifications read at a time
    const unreadNotifications = notifications.filter((notif) => !notif.isRead);
    if (unreadNotifications.length === 0)
      return $.Deferred().resolve().promise();
    return post(
      '/markNotificationsRead',
      {
        'notification_ids[]': unreadNotifications
          .slice(0, MAX_NOTIFICATIONS_READ)
          .map((n) => n.id),
      },
      (result) => {
        for (const n of unreadNotifications.slice(0, MAX_NOTIFICATIONS_READ)) {
          n.markRead();
        }
        if (unreadNotifications.slice(MAX_NOTIFICATIONS_READ).length > 0) {
          this.markAsRead(unreadNotifications.slice(MAX_NOTIFICATIONS_READ));
        }
      }
    );
  }

  public clearAllRead() {
    return post('/clearReadNotifications', {}, (result) => {
      const toClear = this._store.getAll().filter((n) => n.isRead);
      for (const n of toClear) {
        this._store.remove(n);
      }
    });
  }

  public clear(notifications: Notification[]) {
    // TODO: Change to PUT /clearNotifications
    const MAX_NOTIFICATIONS_CLEAR = 100; // clear up to 100 notifications at a time

    if (notifications.length === 0) return;
    return post(
      '/clearNotifications',
      {
        'notification_ids[]': notifications
          .slice(0, MAX_NOTIFICATIONS_CLEAR)
          .map((n) => n.id),
      },
      async (result) => {
        notifications
          .slice(0, MAX_NOTIFICATIONS_CLEAR)
          .map((n) => this._store.remove(n));
        if (notifications.slice(MAX_NOTIFICATIONS_CLEAR).length > 0) {
          this.clear(notifications.slice(MAX_NOTIFICATIONS_CLEAR));
        }
        // TODO: post(/clearNotifications) should wait on all notifications being marked as read before redrawing
      }
    );
  }

  public update(n: Notification) {
    if (!this._store.getById(n.id)) {
      this._store.add(n);
      m.redraw();
    }
  }

  public clearSubscriptions() {
    app.socket?.chainEventsNs.deleteChainEventSubscriptions(
      this._subscriptions
    );
    this._subscriptions = [];
  }

  // TODO: have a min_unread_id and a min_read_id and then submit the value based on request
  public refresh() {
    if (!app.user || !app.user.jwt) {
      throw new Error('must be logged in to refresh notifications');
    }
    const options: any = app.isCustomDomain()
      ? { chain_filter: app.activeChainId() }
      : {};

    // options remain undefined if maxId or minId = 0
    options.maxId = this.maxUnreadId || undefined;

    // TODO: Change to GET /notifications
    return post('/viewNotifications', options, (result) => {
      this._store.clear();
      this._subscriptions = [];
      const ceSubs = [];
      for (const subscriptionJSON of result) {
        const subscription =
          NotificationSubscription.fromJSON(subscriptionJSON);
        this._subscriptions.push(subscription);
        let chainEventType = null;
        if (subscriptionJSON.ChainEventType) {
          chainEventType = ChainEventType.fromJSON(
            subscriptionJSON.ChainEventType
          );
        }
        for (const notificationsReadJSON of subscriptionJSON.NotificationsReads) {
          const data = {
            is_read: notificationsReadJSON.is_read,
                ...notificationsReadJSON.Notification,
          };
          const notification = Notification.fromJSON(
            data,
            subscription,
            chainEventType
          );
          this._store.add(notification);

          // the minimum id is the new max id for next page
          if (this.maxUnreadId === 0 || notificationsReadJSON.id < this.maxUnreadId) {
            this.maxUnreadId = notificationsReadJSON.id;
          }
        }

        if (subscription.category === 'chain-event') ceSubs.push(subscription);
      }
      app.socket.chainEventsNs.addChainEventSubscriptions(ceSubs);
    });
  }
}

export default NotificationsController;
