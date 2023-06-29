/* eslint-disable no-restricted-syntax */
import { EventEmitter } from 'events';
import $ from 'jquery';

import NotificationSubscription, {
  modelFromServer,
} from 'models/NotificationSubscription';
import { NotificationCategories } from 'common-common/src/types';
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

interface SubscriptionOptions {
  chainId?: string;
  threadId?: number;
  commentId?: number;
  snapshotId?: string;
}

class NotificationsController {
  private _discussionStore: NotificationStore = new NotificationStore();
  private _chainEventStore: NotificationStore = new NotificationStore();
  // these are the chains that chain-events has active listeners for (used to detemine what chains are shown on the
  // notification settings page
  private _chainEventSubscribedChainIds: string[] = [];

  public isLoaded = new EventEmitter();
  public isUpdated = new EventEmitter();

  public get chainEventSubscribedChainIds(): string[] {
    return this._chainEventSubscribedChainIds;
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

  public subscribe(category: string, data: SubscriptionOptions) {
    const subscription = this.findSubscription(category, data);
    // convert data keys from camelCase to snake_case for requests
    const requestData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k.replace(/([A-Z])/g, '_$1').toLowerCase(),
        v,
      ])
    );

    if (subscription) {
      return this.enableSubscriptions([subscription]);
    } else {
      return post(
        '/createSubscription',
        {
          category,
          is_active: true,
          ...requestData,
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

    return post('/viewChainEventNotifications', options, (result) => {
      this.parseNotifications(result.notifications);
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

    return post('/viewDiscussionNotifications', options, (result) => {
      this.parseNotifications(result.notifications);
      this.sortNotificationsStore('discussion');
    });
  }

  private parseNotifications(notifications) {
    const subscriptionStore = {};
    for (const rawNotif of notifications) {
      // only create NotificationSubscriptions that have not yet been created
      if (!subscriptionStore[rawNotif.id]) {
        const subscription = NotificationSubscription.fromJSON(rawNotif);
        subscriptionStore[subscription.id] = subscription;
      }

      const notification = Notification.fromJSON(
        rawNotif,
        subscriptionStore[rawNotif.id]
      );

      if (rawNotif.category === 'chain-event') {
        this._chainEventStore.add(notification);
        app.socket.chainEventsNs.addChainEventSubscriptions(
          subscriptionStore[rawNotif.id]
        );
      } else {
        this._discussionStore.add(notification);
      }
    }
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

  public findSubscription(
    categoryId: string,
    data: SubscriptionOptions
  ): NotificationSubscription {
    if (
      categoryId === NotificationCategories.ChainEvent ||
      categoryId === NotificationCategories.NewThread
    ) {
      if (!data.chainId) {
        console.error(
          `Must provide the chain id to find a ${categoryId} subscription`
        );
        return;
      }
      return this._subscriptions.find(
        (s) => s.category === categoryId && s.chainId === data.chainId
      );
    } else if (
      categoryId === NotificationCategories.NewCollaboration ||
      categoryId === NotificationCategories.NewMention
    ) {
      return this._subscriptions.find((s) => s.category === categoryId);
    } else if (
      categoryId === NotificationCategories.NewComment ||
      categoryId === NotificationCategories.NewReaction
    ) {
      if ((!data.threadId && !data.commentId) || !data.chainId) {
        console.error(
          `Must provide a thread id or comment id and a chain id to find a ${categoryId} subscription`
        );
        return;
      }
      return this._subscriptions.find((s) => {
        const commonCheck =
          s.category === categoryId && s.chainId === data.chainId;
        if (data.threadId) {
          return (
            commonCheck &&
            (s.Thread.id === data.threadId ||
              <number>(<unknown>s.Thread) === data.threadId)
          );
        } else {
          return (
            commonCheck &&
            (s.Comment.id === data.commentId ||
              <number>(<unknown>s.Comment) === data.commentId)
          );
        }
      });
    } else if (categoryId === NotificationCategories.SnapshotProposal) {
      if (!data.snapshotId) {
        console.error(
          'Must provide a snapshot space id to find a snapshot-proposal subscription'
        );
        return;
      }
      return this._subscriptions.find(
        (s) => s.category === categoryId && s.snapshotId === data.snapshotId
      );
    } else {
      console.error('Searching for an unsupported subscription category!');
    }
  }
}

export default NotificationsController;
