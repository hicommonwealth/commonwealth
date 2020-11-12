import 'components/header/notifications_menu.scss';

import m from 'mithril';
import Infinite from 'mithril-infinite';
import app from 'state';

import { Popover, PopoverMenu, Button, Icon, Icons, ButtonGroup } from 'construct-ui';
import NotificationRow from 'views/components/notification_row';
import { Notification } from 'models';
import { pluralize } from 'helpers';
import { sortNotifications } from 'helpers/notifications';

const MAX_NOTIFS = 40; // limit number of notifications shown

const NotificationButtons: m.Component<{}> = {
  view: (vnode) => {
    const notifications = app.user.notifications.notifications;
    const chainEventNotifications = app.user.notifications.notifications.filter((n) => n.chainEvent);

    return m(ButtonGroup, {
      class: 'NotificationButtons',
      fluid: true,
      basic: true,
    }, [
      m(Button, {
        label: 'Mark all read',
        onclick: (e) => {
          e.preventDefault();
          if (notifications.length < 1) return;
          app.user.notifications.markAsRead(notifications).then(() => m.redraw());
        },
      }),
      m(Button, {
        label: 'See all',
        onclick: () => (app.activeChainId() || app.activeCommunityId())
          ? m.route.set(`/${app.activeChainId() || app.activeCommunityId()}/notificationsList`)
          : m.route.set('/notificationsList'),
      }),
      m(Popover, {
        content: [
          m('div', { style: 'margin-bottom: 10px' }, [
            `Clear ${pluralize(chainEventNotifications.length, 'chain event notification')}?`
          ]),
          m(Button, {
            label: 'Confirm',
            fluid: true,
            disabled: chainEventNotifications.length === 0,
            onclick: async (e) => {
              e.preventDefault();
              const chainEventNotifications = app.user.notifications.notifications.filter((n) => n.chainEvent);
              if (chainEventNotifications.length === 0) return;
              app.user.notifications.clear(chainEventNotifications).then(() => m.redraw());
            }
          })
        ],
        trigger: m(Button, {
          disabled: chainEventNotifications.length === 0,
          label: 'Clear events',
        }),
        transitionDuration: 0,
        closeOnContentClick: true,
        closeOnEscapeKey: true,
        onClosed: () => { m.redraw(); },
      }),
    ]);
  }
};

const NotificationsMenu: m.Component<{ small?: boolean }> = {
  view: (vnode) => {
    // TODO: Add helper directly on controller
    const { small } = vnode.attrs;
    const notifications = app.user.notifications
      ? app.user.notifications.notifications.sort((a, b) => b.createdAt.unix() - a.createdAt.unix())
      : [];
    const sortedNotifications = sortNotifications(notifications).reverse();
    const unreadNotifications = sortedNotifications.filter((n) => !n[0].isRead).length;
    return m(PopoverMenu, {
      hasArrow: false,
      transitionDuration: 0,
      hoverCloseDelay: 0,
      trigger: m(Button, {
        class: `NotificationsMenuButton ${unreadNotifications > 0 ? 'has-notifications' : 'no-notifications'}`,
        label: [
          m(Icon, { name: Icons.BELL }),
          m('.notification-count', unreadNotifications > 9 ? '∞' : unreadNotifications),
        ],
        size: small ? 'sm' : 'default',
        compact: true,
      }),
      position: 'bottom-end',
      inline: true,
      closeOnContentClick: false,
      menuAttrs: {
        align: 'left',
      },
      class: 'NotificationsMenu',
      content: [
        m('.notification-list', [
          notifications.length > 0
            ? m(Infinite, {
              maxPages: 1, // prevents rollover/repeat
              pageData: () => sortedNotifications.slice(0, MAX_NOTIFS), // limit the number of rows shown here
              key: notifications.length,
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
