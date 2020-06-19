import 'pages/notifications.scss';

import m from 'mithril';

import app from 'state';
import { Button, ButtonGroup } from 'construct-ui';
import NotificationRow from 'views/components/notification_row';
import Sublayout from 'views/sublayout';

const Notifications = {
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      return m('div', 'Must be logged in to view notifications.');
    }
    const notifications = app.user.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
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
          notifications.map((notification) => m(NotificationRow, { notifications: [ notification ] })),
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
