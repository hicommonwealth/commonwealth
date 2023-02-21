/* eslint-disable @typescript-eslint/ban-types */
import { Button, ButtonGroup, Popover, Tag } from 'construct-ui';

import m from 'mithril';
import Infinite from 'mithril-infinite';
import 'pages/notifications_page.scss';

import app from 'state';
import NotificationRow from 'views/components/notification_row';
import PageError from 'views/pages/error';
import Sublayout from 'views/sublayout';

let minDiscussionNotification = 0;
let minChainEventsNotification = 0;
const MAX_NOTIFS = 40;
let init = false;
let pageKey = 0;

function increment(type: 'chain-event' | 'discussion') {
  if (type === 'chain-event') {
    if (
      app.user.notifications.chainEventNotifications.length >=
      minChainEventsNotification + MAX_NOTIFS
    )
      minChainEventsNotification += MAX_NOTIFS;
  } else if (type === 'discussion') {
    if (
      app.user.notifications.discussionNotifications.length >=
      minDiscussionNotification + MAX_NOTIFS
    )
      minDiscussionNotification += MAX_NOTIFS;
  }
}

function nextPage() {
  const numChainEventNotif =
    app.user.notifications.chainEventNotifications.length;
  const numDiscussionNotif =
    app.user.notifications.discussionNotifications.length;

  if (numChainEventNotif < minChainEventsNotification + MAX_NOTIFS) {
    app.user.notifications.getChainEventNotifications().then(() => {
      increment('chain-event');
      m.redraw();
    });
  } else {
    increment('chain-event');
    m.redraw();
  }

  if (numDiscussionNotif < minDiscussionNotification + MAX_NOTIFS) {
    app.user.notifications.getDiscussionNotifications().then(() => {
      increment('discussion');
      m.redraw();
    });
  } else {
    increment('discussion');
    m.redraw();
  }
}

function previousPage() {
  let flag = false;
  if (minChainEventsNotification >= MAX_NOTIFS) {
    minChainEventsNotification -= MAX_NOTIFS;
    flag = true;
  } else if (minChainEventsNotification !== 0) {
    minChainEventsNotification = 0;
    flag = true;
  }

  if (minDiscussionNotification >= MAX_NOTIFS) {
    minDiscussionNotification -= MAX_NOTIFS;
    flag = true;
  } else if (minDiscussionNotification !== 0) {
    minDiscussionNotification = 0;
    flag = true;
  }
  if (flag) m.redraw();
}

const NotificationsPage: m.Component = {
  view: () => {
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

    const discussionNotifications =
      app.user.notifications.discussionNotifications;
    const chainEventNotifications =
      app.user.notifications.chainEventNotifications;

    // const sortedNotifications = sortNotifications(app.user.notifications.allNotifications).reverse();
    // console.log("Sorted Notifications:", sortedNotifications);

    return m(
      Sublayout,
      // {
      //   title: [
      //     'Notifications ',
      //     m(Tag, {
      //       size: 'xs',
      //       label: 'Beta',
      //       style: 'position: relative; top: -2px; margin-left: 6px',
      //     }),
      //   ],
      // },
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
                  pageKey -= 1;
                  console.log(
                    'Before=\t',
                    `ChainEvents: ${minChainEventsNotification}-${
                      minChainEventsNotification + MAX_NOTIFS
                    }, Discussion: ${minDiscussionNotification}-${
                      minDiscussionNotification + MAX_NOTIFS
                    }`
                  );
                  previousPage();
                  console.log(
                    'After=\t',
                    `ChainEvents: ${minChainEventsNotification}-${
                      minChainEventsNotification + MAX_NOTIFS
                    }, Discussion: ${minDiscussionNotification}-${
                      minDiscussionNotification + MAX_NOTIFS
                    }`
                  );
                },
              }),
              m(Button, {
                label: 'Next Page',
                onclick: (e) => {
                  e.preventDefault();
                  pageKey += 1;

                  if (!init) {
                    init = true;
                    minDiscussionNotification =
                      app.user.notifications.discussionNotifications.length;
                    minChainEventsNotification =
                      app.user.notifications.chainEventNotifications.length;
                  }
                  console.log(
                    'Before=\t',
                    `ChainEvents: ${minChainEventsNotification}-${
                      minChainEventsNotification + MAX_NOTIFS
                    }, Discussion: ${minDiscussionNotification}-${
                      minDiscussionNotification + MAX_NOTIFS
                    }`
                  );
                  nextPage();
                  console.log(
                    'After=\t',
                    `ChainEvents: ${minChainEventsNotification}-${
                      minChainEventsNotification + MAX_NOTIFS
                    }, Discussion: ${minDiscussionNotification}-${
                      minDiscussionNotification + MAX_NOTIFS
                    }`
                  );
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
                      if (
                        app.user.notifications.chainEventNotifications
                          .length === 0
                      )
                        return;
                      app.user.notifications
                        .delete(app.user.notifications.chainEventNotifications)
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
              const discussionNotif = discussionNotifications.slice(
                minDiscussionNotification,
                minDiscussionNotification + MAX_NOTIFS
              );

              const chainEventNotif = chainEventNotifications.slice(
                minChainEventsNotification,
                minChainEventsNotification + MAX_NOTIFS
              );

              // TODO: sort this?
              const allNotifications = discussionNotif.concat(chainEventNotif);

              const totalLength = allNotifications.length;
              if (totalLength > 0) {
                return m(Infinite, {
                  maxPages: 1, // prevents rollover/repeat
                  key: totalLength,
                  pageData: () => {
                    return allNotifications;
                  },
                  pageKey: () => {
                    return pageKey;
                  },
                  item: (data) => {
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
