import 'pages/notifications.scss';

import m from 'mithril';

import app from 'state';
import NotificationRow from 'views/components/notification_row';
import Sublayout from 'views/sublayout';
import { NotificationCategories } from 'types';
import { Button, ButtonGroup } from 'construct-ui';

const Notifications = {
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      return m('div', 'Must be logged in to view notifications.');
    }
    const subscriptions = app.user.notifications.subscriptions.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const notifications = app.user.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const newCommunitySubscription = app.user.notifications.subscriptions
      .find((v) => v.category === NotificationCategories.NewCommunity);
    const chainOrCommunitySubscription = app.user.activeAccount
      && app.user.activeAccount.chain
      && app.user.notifications.subscriptions
        .find((v) => v.category === NotificationCategories.NewThread && v.objectId === app.user.activeAccount.chain.id);
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
              app.user.notifications.refresh().then(() => m.redraw());
            }
          }),
          m(Button, {
            label: 'Mark all as read',
            onclick: (e) => {
              e.preventDefault();
              app.user.notifications.markAsRead(notifications).then(() => m.redraw());
            }
          }),
        ]),
        m('.NotificationsList', [
          notifications.map((notification) => m(NotificationRow, { notifications: [notification] })),
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
