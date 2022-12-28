/* eslint-disable @typescript-eslint/ban-types */
import 'pages/notifications_page.scss';

import m from 'mithril';

// @ TODO: REACT REMOVE Infinite
// import Infinite from 'mithril-infinite';
// @TODO: REACT CLEANUP

import app from 'state';
import NotificationRow from 'views/components/notification_row';
import Sublayout from 'views/sublayout';
import PageError from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';

// TODO: FIX UI FOR THESE
import { CWButton } from '../components/component_kit/cw_button';
import { CWPopover } from '../components/component_kit/cw_popover/cw_popover';
import { CWTag } from '../components/component_kit/cw_tag';

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

const NotificationsPage: m.Component<{}> = {
  view: (vnode) => {
    if (!app.isLoggedIn())
      return m(PageError, {
        title: [
          'Notifications ',
          m(CWTag, {
            label: 'Beta',
          }),
        ],
        message: 'This page requires you to be logged in.',
      });

    const activeEntity = app.chain;
    if (!activeEntity)
      return m(PageLoading, {
        // title: [
        //   'Notifications ',
        //   m(Tag, {
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
            '.ButtonGroup',
            {
              class: 'NotificationButtons',
            },
            [
              m(CWButton, {
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
              m(CWButton, {
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
              m(CWButton, {
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
              m(CWPopover, {
                content: [
                  m(
                    'div',
                    { style: 'margin-bottom: 10px' },
                    'Clear all chain notifications?'
                  ),
                  m(CWButton, {
                    label: 'Confirm',
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
                trigger: m(CWButton, {
                  label: 'Clear chain events',
                }),
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
                return null; // @TODO @REACT FIX ME
                // return m(Infinite, {
                //   maxPages: 1, // prevents rollover/repeat
                //   key: totalLength,
                //   pageData: () => {
                //     return allNotifications;
                //   },
                //   pageKey: () => {
                //     return pageKey;
                //   },
                //   item: (data, opts, index) => {
                //     return m(NotificationRow, {
                //       notifications: [data],
                //       onListPage: true,
                //     });
                //   },
                // });
              } else return m('.no-notifications', 'No Notifications');
            })(),
          ]),
        ]),
      ]
    );
  },
};

export default NotificationsPage;
