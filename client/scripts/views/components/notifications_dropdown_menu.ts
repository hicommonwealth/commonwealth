import m from 'mithril';
import Infinite from 'mithril-infinite';
import app from 'state';

import { PopoverMenu, Button, Icons } from 'construct-ui';
import { HeaderBatchNotificationRow } from 'views/components/sidebar/notification_row';
import { Notification } from 'models';
import { sortNotifications } from 'helpers/notifications';

const NotificationsDropdownMenu: m.Component = {
  view: (vnode) => {
    const notifications = app.login.notifications
      ? app.login.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix())
      : [];
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const sortedNotifications = sortNotifications(notifications, 'subscription', 'objectId');

    return m(PopoverMenu, {
      transitionDuration: 0,
      hoverCloseDelay: 0,
      trigger: m(Button, {
        iconLeft: Icons.BELL,
        size: 'sm',
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
            maxPages: 1, // prevents rollover/repeat
            pageData: () => sortedNotifications,
            item: (data, opts, index) => {
              return m(HeaderBatchNotificationRow, { notifications: data });
            },
          })
          : m('li.no-notifications', 'No Notifications'),
      ]),
    });
  },
};

export default NotificationsDropdownMenu;
