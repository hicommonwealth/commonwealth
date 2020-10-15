import 'pages/notificationsList.scss';

import m from 'mithril';
import Infinite from 'mithril-infinite';
import { Button, ButtonGroup } from 'construct-ui';

import app from 'state';
import { sortNotifications } from 'helpers/notifications';
import NotificationRow from 'views/components/notification_row';
import Sublayout from 'views/sublayout';

const NotificationsPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.isLoggedIn()) {
      return m('div', 'Must be logged in to view notifications.');
    }

    const notifications = app.user.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix());
    const sortedNotifications = sortNotifications(notifications).reverse();

    return m(Sublayout, {
      class: 'NotificationsListPage',
      title: 'Notifications',
    }, [
      m('.forum-container', [
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
          sortedNotifications.length > 0
            ? m(Infinite, {
              maxPages: 1, // prevents rollover/repeat
              pageData: () => sortedNotifications,
              item: (data, opts, index) => {
                return m(NotificationRow, { notifications: data });
              },
            })
            : m('.no-notifications', 'No Notifications'),
        ])
      ]),
    ]);
  }
};

export default NotificationsPage;
