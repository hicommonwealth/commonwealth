/* eslint-disable @typescript-eslint/ban-types */
import 'pages/notifications_page.scss';

import m from 'mithril';
import Infinite from 'mithril-infinite';
import { Button, ButtonGroup, Popover, Tag } from 'construct-ui';
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component } from 'mithrilInterop';

import app from 'state';
import NotificationRow from 'views/components/notification_row';
import Sublayout from 'views/sublayout';
import PageError from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';

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
      redraw();
    });
  } else {
    increment('chain-event');
    redraw();
  }

  if (numDiscussionNotif < minDiscussionNotification + MAX_NOTIFS) {
    app.user.notifications.getDiscussionNotifications().then(() => {
      increment('discussion');
      redraw();
    });
  } else {
    increment('discussion');
    redraw();
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
  if (flag) redraw();
}

const NotificationsPage: Component<{}> = {
  view: (vnode) => {
    if (!app.isLoggedIn())
      return render(PageError, {
        title: [
          'Notifications ',
          render(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
        message: 'This page requires you to be logged in.',
      });

    const activeEntity = app.chain;
    if (!activeEntity)
      return render(PageLoading, {
        // title: [
        //   'Notifications ',
        //   render(Tag, {
        //     size: 'xs',
        //     label: 'Beta',
        //     style: 'position: relative; top: -2px; margin-left: 6px',
        //   }),
        // ],
      });

    const discussionNotifications =
      app.user.notifications.discussionNotifications;
    const chainEventNotifications =
      app.user.notifications.chainEventNotifications;

    // const sortedNotifications = sortNotifications(app.user.notifications.allNotifications).reverse();
    // console.log("Sorted Notifications:", sortedNotifications);

    return render(
      Sublayout,
      // {
      //   title: [
      //     'Notifications ',
      //     render(Tag, {
      //       size: 'xs',
      //       label: 'Beta',
      //       style: 'position: relative; top: -2px; margin-left: 6px',
      //     }),
      //   ],
      // },
      [
        render('.NotificationsPage', [
          render(
            ButtonGroup,
            {
              class: 'NotificationButtons',
              outlined: true,
            },
            [
              render(Button, {
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
              render(Button, {
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
              render(Button, {
                label: 'Mark all as read',
                onclick: (e) => {
                  e.preventDefault();
                  app.user.notifications
                    .markAsRead(
                      discussionNotifications.concat(chainEventNotifications)
                    )
                    .then(() => redraw());
                },
              }),
              render(Popover, {
                content: [
                  render(
                    'div',
                    { style: 'margin-bottom: 10px' },
                    'Clear all chain notifications?'
                  ),
                  render(Button, {
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
                        .then(() => redraw());
                    },
                  }),
                ],
                trigger: render(Button, {
                  label: 'Clear chain events',
                }),
                transitionDuration: 0,
                closeOnContentClick: true,
                closeOnEscapeKey: true,
                onClosed: () => {
                  redraw();
                },
              }),
            ]
          ),
          render('.NotificationsList', [
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
                return render(Infinite, {
                  maxPages: 1, // prevents rollover/repeat
                  key: totalLength,
                  pageData: () => {
                    return allNotifications;
                  },
                  pageKey: () => {
                    return pageKey;
                  },
                  item: (data, opts, index) => {
                    return render(NotificationRow, {
                      notifications: [data],
                      onListPage: true,
                    });
                  },
                });
              } else return render('.no-notifications', 'No Notifications');
            })(),
          ]),
        ]),
      ]
    );
  },
};

export default NotificationsPage;
