/* eslint-disable no-restricted-syntax */
import { EventEmitter } from 'events';
import $ from 'jquery';

import NotificationSubscription, { modelFromServer } from 'models/NotificationSubscription';

import app from 'state';

import { NotificationStore } from 'stores';
import Notification from '../../models/Notification';

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

const get = (route, args, callback) => {
  args['jwt'] = app.user.jwt;
  return $.get(app.serverUrl() + route, args)
    .then((resp) => {
      if (resp.status === 'Success') {
        callback(resp.result);
      } else {
        console.error(resp);
      }
    })
    .catch((e) => console.error(e));
};

interface NotifOptions {
  chain_filter: string;
  maxId: number;
}

class NotificationsController {
  private _discussionStore: NotificationStore = new NotificationStore();
  private _chainEventStore: NotificationStore = new NotificationStore();
  // these are the chains that chain-events has active listeners for (used to detemine what chains are shown on the
  // notification settings page
  private _chainEventSubscribedChainIds: string[] = [];

  private _maxChainEventNotificationId: number = Number.POSITIVE_INFINITY;
  private _maxDiscussionNotificationId: number = Number.POSITIVE_INFINITY;

  private _numPages = 0;
  private _numUnread = 0;

  public isLoaded = new EventEmitter();
  public isUpdated = new EventEmitter();

  public get chainEventSubscribedChainIds(): string[] {
    return this._chainEventSubscribedChainIds;
  }

  public get numPages(): number {
    return this._numPages;
  }

  public get numUnread(): number {
    return this._numUnread;
  }

  public get discussionNotifications(): Notification[] {
    return this._discussionStore.getAll();
  }

  public get chainEventNotifications(): Notification[] {
    return this._chainEventStore.getAll();
  }

  public get allNotifications(): Notification[] {
    return this._discussionStore
      .getAll()
      .concat(this._chainEventStore.getAll());
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
      return post(
        '/createSubscription',
        {
          category,
          object_id: objectId,
          is_active: true,
        },
        (result) => {
          const newSubscription = modelFromServer(result);
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
      () => {
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
      () => {
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
      () => {
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
      () => {
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
      () => {
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
      () => {
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
    return post('/clearReadNotifications', {}, () => {
      const toClear = this.allNotifications.filter((n) => n.isRead);
      for (const n of toClear) {
        this.removeFromStore(n);
      }
    });
  }

  public clear() {
    this._discussionStore.clear();
    this._chainEventStore.clear();
  }

  public removeFromStore(n) {
    if (n.chainEvent) this._chainEventStore.remove(n);
    else this._discussionStore.remove(n);
  }

  public delete(notifications: Notification[]) {
    // TODO: Change to PUT /clearNotifications
    const MAX_NOTIFICATIONS_CLEAR = 100; // delete up to 100 notifications at a time

    if (notifications.length === 0) return;
    return post(
      '/clearNotifications',
      {
        'notification_ids[]': notifications
          .slice(0, MAX_NOTIFICATIONS_CLEAR)
          .map((n) => n.id),
      },
      async () => {
        notifications
          .slice(0, MAX_NOTIFICATIONS_CLEAR)
          .map((n) => this.removeFromStore(n));
        if (notifications.slice(MAX_NOTIFICATIONS_CLEAR).length > 0) {
          this.delete(notifications.slice(MAX_NOTIFICATIONS_CLEAR));
        }
        // TODO: post(/clearNotifications) should wait on all notifications being marked as read before redrawing
      }
    );
  }

  public update(n: Notification) {
    if (n.chainEvent && !this._chainEventStore.getById(n.id)) {
      this._chainEventStore.add(n);
      this.isUpdated.emit('redraw');
    } else if (!n.chainEvent && !this._discussionStore.getById(n.id)) {
      this._discussionStore.add(n);
      this.isUpdated.emit('redraw');
    }
  }

  public clearSubscriptions() {
    app.socket?.chainEventsNs.deleteChainEventSubscriptions(
      this._subscriptions
    );
    this._subscriptions = [];
  }

  public sortNotificationsStore(storeType: string) {
    if (storeType == 'chain-events') {
      const unsortedNotifications = this.chainEventNotifications;
      this._chainEventStore.clear();
      unsortedNotifications.sort((a, b) => b.id - a.id);
      for (const notif of unsortedNotifications)
        this._chainEventStore.add(notif);
    } else {
      const unsortedNotifications = this.discussionNotifications;
      this._discussionStore.clear();
      unsortedNotifications.sort((a, b) => b.id - a.id);
      for (const notif of unsortedNotifications)
        this._discussionStore.add(notif);
    }
  }

  public getChainEventNotifications() {
    if (!app.user || !app.user.jwt) {
      throw new Error('must be logged in to refresh notifications');
    }

    const options: NotifOptions = app.isCustomDomain()
      ? { chain_filter: app.activeChainId(), maxId: undefined }
      : { chain_filter: undefined, maxId: undefined };

    if (this._maxChainEventNotificationId !== Number.POSITIVE_INFINITY)
      options.maxId = this._maxChainEventNotificationId;

    return post('/viewChainEventNotifications', options, (result) => {
      this._numPages = result.numPages;
      this._numUnread = result.numUnread;
      this.parseNotifications(result.subscriptions);
      this.sortNotificationsStore('chain-events');
    });
  }

  public getDiscussionNotifications() {
    if (!app.user || !app.user.jwt) {
      throw new Error('must be logged in to refresh notifications');
    }
    const options: NotifOptions = app.isCustomDomain()
      ? { chain_filter: app.activeChainId(), maxId: undefined }
      : { chain_filter: undefined, maxId: undefined };

    if (this._maxDiscussionNotificationId !== Number.POSITIVE_INFINITY)
      options.maxId = this._maxDiscussionNotificationId;

    return post('/viewDiscussionNotifications', options, (result) => {
      this._numPages = result.numPages;
      this._numUnread = result.numUnread;
      this.parseNotifications(result.subscriptions);
      this.sortNotificationsStore('discussion');
    });
  }

  private parseNotifications(subscriptions) {
    const ceSubs = [];

    for (const subscriptionJSON of subscriptions) {
      const subscription = NotificationSubscription.fromJSON(subscriptionJSON);

      // save the notification read + notification instances if any
      for (const notificationsReadJSON of subscriptionJSON.NotificationsReads) {
        const data = {
          is_read: notificationsReadJSON.is_read,
          ...notificationsReadJSON.Notification,
        };
        const notification = Notification.fromJSON(data, subscription);

        if (subscription.category === 'chain-event') {
          if (!this._chainEventStore.getById(notification.id))
            this._chainEventStore.add(notification);
          // the minimum id is the new max id for next page
          if (notificationsReadJSON.id < this._maxChainEventNotificationId) {
            this._maxChainEventNotificationId = notificationsReadJSON.id;
            if (notificationsReadJSON.id === 1)
              this._maxChainEventNotificationId = 0;
          }
        } else {
          if (!this._discussionStore.getById(notification.id))
            this._discussionStore.add(notification);
          if (notificationsReadJSON.id < this._maxDiscussionNotificationId) {
            this._maxDiscussionNotificationId = notificationsReadJSON.id;
            if (notificationsReadJSON.id === 1)
              this._maxDiscussionNotificationId = 0;
          }
        }
      }
      if (subscription.category === 'chain-event') ceSubs.push(subscription);
    }
    app.socket.chainEventsNs.addChainEventSubscriptions(ceSubs);
  }

  public getSubscriptions() {
    return get('/viewSubscriptions', {}, (result) => {
      this._subscriptions = [];

      const subs = result;
      subs.forEach((sub) => this._subscriptions.push(modelFromServer(sub)));
    });
  }

  public getSubscribedChains() {
    return post('/getSubscribedChains', {}, (result) => {
      this._chainEventSubscribedChainIds = result.map((x) => x.id);
    });
  }

  public async refresh() {
    await Promise.all([
      this.getDiscussionNotifications(),
      this.getChainEventNotifications(),
      this.getSubscriptions(),
      this.getSubscribedChains(),
    ]);
    this.isLoaded.emit('redraw');
    return Promise.resolve();
  }
}

export default NotificationsController;
