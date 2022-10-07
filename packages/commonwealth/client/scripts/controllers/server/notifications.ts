/* eslint-disable no-restricted-syntax */
import $ from 'jquery';
import m from 'mithril';

import { NotificationStore } from 'stores';
import {
  NotificationSubscription,
  Notification as CWNotification,
  ChainEventType,
} from 'models';
import { modelFromServer } from 'models/NotificationSubscription';
import { CWEvent, Label as ChainEventLabel } from 'chain-events/src';

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

  private _maxChainEventNotificationId: number = Number.POSITIVE_INFINITY;
  private _maxDiscussionNotificationId: number = Number.POSITIVE_INFINITY;

  private _numPages = 0;
  private _numUnread = 0;

  public get numPages(): number {
    return this._numPages;
  }

  public get numUnread(): number {
    return this._numUnread;
  }

  public get discussionNotifications(): CWNotification[] {
    return this._discussionStore.getAll();
  }

  public get chainEventNotifications(): CWNotification[] {
    return this._chainEventStore.getAll();
  }

  public get allNotifications(): CWNotification[] {
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

  public async updateBrowserNotificationsStatus(enabled: boolean) {
    try {
      await $.post(`${app.serverUrl()}/setBrowserNotifications`, {
        enabled,
        jwt: app.user.jwt,
      });
      app.user.setBrowserNotificationsEnabled(enabled);
    } catch (e) {
      console.log(e);
    }
  }

  public async requestBrowserNotifications(): Promise<NotificationPermission> {
    try {
      const status = await Notification.requestPermission();
      if (status === 'granted') {
        console.log('browser notification permissions granted');
        await this.updateBrowserNotificationsStatus(true);
      } else {
        await this.updateBrowserNotificationsStatus(false);
        console.log('browser notification permissions disabled');
      }

      return status;
    } catch (e) {
      console.log(e);
      return 'denied';
    }
  }

  public fireBrowserNotification(
    title: string,
    body: string,
    tag: string,
    onclick?: () => void
  ) {
    try {
      const notification = new Notification(title, {
        body,
        tag,
        icon: `favicon.ico`,
      });
      notification.onclick = onclick;

      setTimeout(() => {
        notification.close();
      }, 6000);
    } catch (e) {
      console.log('browser notification error', e);
    }
  }

  public fireChainEventBrowserNotification(notification: CWNotification) {
    const chainId = notification.chainEvent.type.chain;

    // construct compatible CW event from DB by inserting network from type
    const chainEvent: CWEvent = {
      blockNumber: notification.chainEvent.blockNumber,
      network: notification.chainEvent.type.eventNetwork,
      data: notification.chainEvent.data,
    };
    const chainName = app.config.chains.getById(chainId)?.name;
    const label = ChainEventLabel(chainId, chainEvent);

    this.fireBrowserNotification(
      `${label.heading} on ${chainName}`,
      `Block ${notification.chainEvent.blockNumber}`,
      'default_tag'
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

  public markAsRead(notifications: CWNotification[]) {
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

  public delete(notifications: CWNotification[]) {
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
      async (result) => {
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

  public update(n: CWNotification) {
    if (n.chainEvent && !this._chainEventStore.getById(n.id)) {
      this._chainEventStore.add(n);
      if (app.user.browserNotificationsEnabled) {
        console.log('should be firing the browser notification');
        this.fireChainEventBrowserNotification(n);
      }
      m.redraw();
    } else if (!n.chainEvent && !this._discussionStore.getById(n.id)) {
      this._discussionStore.add(n);
      m.redraw();
    }
  }

  public clearSubscriptions() {
    app.socket?.chainEventsNs.deleteChainEventSubscriptions(
      this._subscriptions
    );
    this._subscriptions = [];
  }

  public sortNotificationsStore(storeType: string) {
    if (storeType === 'chain-events') {
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

      // save the chainEventType for the subscription if the subscription type is chain-event
      let chainEventType = null;
      if (subscriptionJSON.ChainEventType) {
        chainEventType = ChainEventType.fromJSON(
          subscriptionJSON.ChainEventType
        );
      }

      // save the notification read + notification instances if any
      for (const notificationsReadJSON of subscriptionJSON.NotificationsReads) {
        const data = {
          is_read: notificationsReadJSON.is_read,
          ...notificationsReadJSON.Notification,
        };
        const notification = CWNotification.fromJSON(
          data,
          subscription,
          chainEventType
        );

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

  public async refresh() {
    return Promise.all([
      this.getDiscussionNotifications(),
      this.getChainEventNotifications(),
      this.getSubscriptions(),
    ]);
  }
}

export default NotificationsController;
