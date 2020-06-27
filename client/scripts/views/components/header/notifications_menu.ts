import 'components/header/notifications_menu.scss';

import m from 'mithril';
import Infinite from 'mithril-infinite';
import app from 'state';

import { PopoverMenu, Button, Icons, ButtonGroup } from 'construct-ui';
import NotificationRow from 'views/components/notification_row';
import { Notification } from 'models';
import { sortNotifications } from 'helpers/notifications';

const NotificationButtons: m.Component = {
  view: (vnode) => {
    const notifications = app.user.notifications.notifications;
    return m(ButtonGroup, {
      class: 'NotificationButtons',
      fluid: true,
      basic: true,
    }, [
      m(Button, {
        label: 'Mark all as read',
        onclick: (e) => {
          e.preventDefault();
          if (notifications.length < 1) return;
          app.user.notifications.markAsRead(notifications).then(() => m.redraw());
        },
      }),
      m(Button, {
        label: 'See all',
        onclick: (e) => m.route.set('/notifications'),
      }),
    ]);
  }
};

const NotificationsMenu: m.Component = {
  view: (vnode) => {
    // TODO: Add helper directly on controller
    const notifications = app.user.notifications
      ? app.user.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix())
      : [];
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;
    const sortedNotifications = sortNotifications(notifications, 'subscription', 'objectId');

    return m(PopoverMenu, {
      transitionDuration: 0,
      hoverCloseDelay: 0,
      trigger: m(Button, {
        iconLeft: Icons.BELL,
        size: 'sm',
        label: m('.notification-badge', unreadNotifications),
      }),
      position: 'bottom-end',
      inline: true,
      closeOnContentClick: true,
      menuAttrs: {
        align: 'left',
      },
      class: 'NotificationsMenu',
      content: [
        m('.notification-list', [
          notifications.length > 0
            ? m(Infinite, {
              maxPages: 1, // prevents rollover/repeat
              pageData: () => sortedNotifications,
              item: (data, opts, index) => {
                return m(NotificationRow, { notifications: data });
              },
            })
            : m('li.no-notifications', 'No Notifications'),
        ]),
        m(NotificationButtons),
      ]
    });
  },
};

export default NotificationsMenu;
