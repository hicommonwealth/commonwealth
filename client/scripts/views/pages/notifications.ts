import 'pages/notifications.scss';

import m from 'mithril';

import app from 'state';
import { HeaderBatchNotificationRow } from 'views/components/sidebar/notification_row';
import Sublayout from 'views/sublayout';
import { NotificationCategories } from 'types';
import { Button, ButtonGroup } from 'construct-ui';

const Notifications = {
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      return m('div', 'Must be logged in to view notifications.');
    }
    const subscriptions = app.login.notifications.subscriptions.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const notifications = app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const newCommunitySubscription = app.login.notifications.subscriptions
      .find((v) => v.category === NotificationCategories.NewCommunity);
    const chainOrCommunitySubscription = app.vm.activeAccount
      && app.vm.activeAccount.chain
      && app.login.notifications.subscriptions
        .find((v) => v.category === NotificationCategories.NewThread && v.objectId === app.vm.activeAccount.chain.id);
    return m('.Notifications', [
      m('.forum-container', [
        m('h3', 'Notifications'),
        m(ButtonGroup, {
          class: 'NotificationButtons',
          outlined: true,
        }, [
          m(Button, {
            label: 'Refresh',
            onclick: (e) => {
              e.preventDefault();
              app.login.notifications.refresh().then(() => m.redraw());
            }
          }),
          m(Button, {
            label: 'Mark all as read',
            onclick: (e) => {
              e.preventDefault();
              app.login.notifications.markAsRead(notifications).then(() => m.redraw());
            }
          }),
          m(Button, {
            label: 'Clear all read',
            onclick: (e) => {
              e.preventDefault();
              app.login.notifications.clearAllRead().then(() => m.redraw());
            }
          }),
        ]),
        m('.NotificationsList', [
          notifications.map((notification) => m(HeaderBatchNotificationRow, { notifications: [notification] })),
        ])
      ]),
    ]);
  }
};

const NotificationsPage = {
  view: (vnode) => {
    return m(Sublayout, {
      class: 'NotificationsPage',
    }, [
      m(Notifications)
    ]);
  }
};

export default NotificationsPage;
