/* eslint-disable @typescript-eslint/ban-types */
import 'pages/notifications_page.scss';

import m from 'mithril';
import Infinite from 'mithril-infinite';
import { Button, ButtonGroup, Popover, Tag } from 'construct-ui';

import app from 'state';
import { sortNotifications } from 'helpers/notifications';
import NotificationRow from 'views/components/notification_row';
import Sublayout from 'views/sublayout';
import PageError from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';

let minDiscussionNotificationId = 0;
let minChainEventNotificationId = 0;
const MAX_NOTIF = 40;

const NotificationsPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.isLoggedIn())
      return m(PageError, {
        title: [
          'Notifications ',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        message: 'This page requires you to be logged in.',
      });

    const activeEntity = app.chain;
    if (!activeEntity)
      return m(PageLoading, {
        title: [
          'Notifications ',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
      });

    const discussionNotifications =
      app.user.notifications.discussionNotifications;
    const chainEventNotifications =
      app.user.notifications.chainEventNotifications;

    // const sortedNotifications = sortNotifications(app.user.notifications.allNotifications).reverse();
    // console.log("Sorted Notifications:", sortedNotifications);

    return m(
      Sublayout,
      {
        title: [
          'Notifications ',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
      },
      [
        m('.NotificationsPage', [
          m(
            ButtonGroup,
            {
              class: 'NotificationButtons',
              outlined: true,
            },
            [
              m(Button, {
                label: 'Previous Page',
                onclick: (e) => {
                  e.preventDefault();
                  minDiscussionNotificationId -= MAX_NOTIF / 2;
                  minChainEventNotificationId -= MAX_NOTIF / 2;
                  m.redraw();
                },
              }),
              m(Button, {
                label: 'Next Page',
                onclick: (e) => {
                  e.preventDefault();
                  app.user.notifications.refresh().then(() => m.redraw());
                  // TODO: same checks as on notifications menu i.e. stop increase when no more notif/etc
                  minDiscussionNotificationId += MAX_NOTIF / 2;
                  minChainEventNotificationId += MAX_NOTIF / 2;
                  m.redraw();
                },
              }),
              m(Button, {
                label: 'Mark all as read',
                onclick: (e) => {
                  e.preventDefault();
                  app.user.notifications
                    .markAsRead(
                      discussionNotifications.concat(chainEventNotifications)
                    )
                    .then(() => m.redraw());
                },
              }),
              m(Popover, {
                content: [
                  m(
                    'div',
                    { style: 'margin-bottom: 10px' },
                    'Clear all chain notifications?'
                  ),
                  m(Button, {
                    label: 'Confirm',
                    fluid: true,
                    rounded: true,
                    onclick: async (e) => {
                      e.preventDefault();
                      const chainEventNotifications =
                        app.user.notifications.chainEventNotifications;
                      if (chainEventNotifications.length === 0) return;
                      app.user.notifications
                        .delete(chainEventNotifications)
                        .then(() => m.redraw());
                    },
                  }),
                ],
                trigger: m(Button, {
                  label: 'Clear chain events',
                }),
                transitionDuration: 0,
                closeOnContentClick: true,
                closeOnEscapeKey: true,
                onClosed: () => {
                  m.redraw();
                },
              }),
            ]
          ),
          m('.NotificationsList', [
            (() => {
              const totalLength = discussionNotifications.length + chainEventNotifications.length / 2;
              console.log('total length', totalLength);
              if (totalLength > 0) {
                return m(Infinite, {
                  maxPages: 1, // prevents rollover/repeat
                  key: totalLength,
                  pageData: () => {
                    const discussionNotif = discussionNotifications.slice(
                      minDiscussionNotificationId,
                      minDiscussionNotificationId + MAX_NOTIF / 2
                    );
                    const chainEventNotif = chainEventNotifications.slice(
                      minChainEventNotificationId,
                      minChainEventNotificationId + MAX_NOTIF / 2
                    );
                    return discussionNotif.concat(chainEventNotif);
                  },
                  item: (data, opts, index) => {
                    return m(NotificationRow, {
                      notifications: [data],
                      onListPage: true,
                    });
                  },
                });
              } else return m('.no-notifications', 'No Notifications');
            })(),
          ]),
        ]),
      ]
    );
  },
};

export default NotificationsPage;
