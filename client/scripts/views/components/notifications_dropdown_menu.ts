import m from 'mithril';
import Infinite from 'mithril-infinite';
import app from 'state';

import { PopoverMenu, Button, Icons } from 'construct-ui';
import HeaderNotificationRow from 'views/components/sidebar/notification_row';
import moment from 'moment';
import { Notification, NotificationSubscription, ChainEvent } from 'models';

class BatchedNotification {
  public readonly id: number;
  public readonly data: string;
  public readonly count: number;
  public readonly createdAt: moment.Moment;
  public readonly subscription: NotificationSubscription;
  public readonly chainEvent?: ChainEvent;
  private _batch?: Notification[];
  private _isRead: boolean;

  public get isRead(): boolean {
    return this._isRead;
  }

  public get getBatch(): Notification[] {
    return this._batch;
  }

  public addNotification(n: Notification): void {
    this._batch.push(n);
  }

  public markBatchRead(): void {
    this._batch.map((n) => {
      n.markRead();
    });
  }

  constructor(notification: Notification) {
    this.id = notification.id;
    this.data = notification.data;
    this._isRead = notification.isRead;
    this.createdAt = notification.createdAt;
    this.subscription = notification.subscription;
    this.chainEvent = notification.chainEvent;
    this.count = 0;
    this._batch = [];
  }
}

const NotificationsDrowdownMenu: m.Component<{},{}> = {
  view: (vnode) => {
    const notifications = app.login.notifications
      ? app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix()) : [];
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const notificationsAndArrays = [];


    return m(PopoverMenu, {
      transitionDuration: 0,
      hoverCloseDelay: 0,
      trigger: m(Button, {
        iconLeft: Icons.BELL,
      }),
      position: 'bottom-end',
      closeOnContentClick: true,
      menuAttrs: {
        align: 'left',
      },
      class: 'notification-menu',
      content: m('.notification-list', [
        notifications.length > 0
          ? m(Infinite, {
            maxPages: 8,
            pageData: () => notifications,
            item: (data, opts, index) => m(HeaderNotificationRow, { notification: data }),
          })
          : m('li.no-notifications', 'No Notifications'),
      ]),
    });
  },
};

export default NotificationsDrowdownMenu;
