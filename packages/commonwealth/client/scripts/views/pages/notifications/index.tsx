/* @jsx jsx */
import React from 'react';

import { redraw, jsx } from 'mithrilInterop';
// import Infinite from 'mithril-infinite';
import ClickAwayListener from '@mui/base/ClickAwayListener';

import 'pages/notifications/index.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageError from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import { NotificationRow } from './notification_row';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  Popover,
  usePopover,
} from '../../components/component_kit/cw_popover/cw_popover';
import { CWText } from '../../components/component_kit/cw_text';

const MAX_NOTIFS = 40;

let minDiscussionNotification = 0;
let minChainEventsNotification = 0;
let init = false;
let pageKey = 0;

const increment = (type: 'chain-event' | 'discussion') => {
  if (type === 'chain-event') {
    if (
      app.user.notifications.chainEventNotifications.length >=
      minChainEventsNotification + MAX_NOTIFS
    ) {
      minChainEventsNotification += MAX_NOTIFS;
    }
  } else if (type === 'discussion') {
    if (
      app.user.notifications.discussionNotifications.length >=
      minDiscussionNotification + MAX_NOTIFS
    ) {
      minDiscussionNotification += MAX_NOTIFS;
    }
  }
};

const nextPage = () => {
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
};

const previousPage = () => {
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
};

const NotificationsPage = () => {
  const popoverProps = usePopover();

  if (!app.isLoggedIn()) {
    return <PageError message="This page requires you to be logged in." />;
  }

  const activeEntity = app.chain;

  if (!activeEntity) {
    return <PageLoading />;
  }

  const discussionNotifications =
    app.user.notifications.discussionNotifications;
  const chainEventNotifications =
    app.user.notifications.chainEventNotifications;

  return (
    <Sublayout>
      <div className="NotificationsPage">
        <div className="notifications-buttons-row">
          <CWButton
            label="Previous Page"
            onClick={(e) => {
              e.preventDefault();
              pageKey -= 1;
              // console.log(
              //   'Before=\t',
              //   `ChainEvents: ${minChainEventsNotification}-${
              //     minChainEventsNotification + MAX_NOTIFS
              //   }, Discussion: ${minDiscussionNotification}-${
              //     minDiscussionNotification + MAX_NOTIFS
              //   }`
              // );
              previousPage();
              // console.log(
              //   'After=\t',
              //   `ChainEvents: ${minChainEventsNotification}-${
              //     minChainEventsNotification + MAX_NOTIFS
              //   }, Discussion: ${minDiscussionNotification}-${
              //     minDiscussionNotification + MAX_NOTIFS
              //   }`
              // );
            }}
          />
          <CWButton
            label="Next Page"
            onClick={(e) => {
              e.preventDefault();
              pageKey += 1;

              if (!init) {
                init = true;
                minDiscussionNotification =
                  app.user.notifications.discussionNotifications.length;
                minChainEventsNotification =
                  app.user.notifications.chainEventNotifications.length;
              }
              // console.log(
              //   'Before=\t',
              //   `ChainEvents: ${minChainEventsNotification}-${
              //     minChainEventsNotification + MAX_NOTIFS
              //   }, Discussion: ${minDiscussionNotification}-${
              //     minDiscussionNotification + MAX_NOTIFS
              //   }`
              // );
              nextPage();
              // console.log(
              //   'After=\t',
              //   `ChainEvents: ${minChainEventsNotification}-${
              //     minChainEventsNotification + MAX_NOTIFS
              //   }, Discussion: ${minDiscussionNotification}-${
              //     minDiscussionNotification + MAX_NOTIFS
              //   }`
              // );
            }}
          />
          <CWButton
            label="Mark all as read"
            onClick={(e) => {
              e.preventDefault();
              app.user.notifications
                .markAsRead(
                  discussionNotifications.concat(chainEventNotifications)
                )
                .then(() => redraw());
            }}
          />
          <ClickAwayListener onClickAway={() => popoverProps.setAnchorEl(null)}>
            <div>
              <CWButton
                label="Clear chain events"
                onClick={popoverProps.handleInteraction}
              />
              <Popover
                content={
                  <div>
                    <div style={{ marginBottom: '10px' }}>
                      Clear all chain notifications?
                    </div>
                    <CWButton
                      label="Confirm"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (
                          app.user.notifications.chainEventNotifications
                            .length === 0
                        )
                          return;
                        app.user.notifications
                          .delete(
                            app.user.notifications.chainEventNotifications
                          )
                          .then(() => redraw());
                      }}
                    />
                  </div>
                }
                {...popoverProps}
              />
            </div>
          </ClickAwayListener>
        </div>
        <div className="NotificationsList">
          {(() => {
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
              // return m(Infinite, {
              //   maxPages: 1, // prevents rollover/repeat
              //   key: totalLength,
              //   pageData: () => {
              //     return allNotifications;
              //   },
              //   pageKey: () => {
              //     return pageKey;
              //   },
              //   item: (data) => (
              //     <NotificationRow notifications={[data]} onListPage />
              //   ),
              // });
            } else
              return (
                <div className="no-notifications">
                  <CWText>No Notifications</CWText>
                </div>
              );
          })()}
        </div>
      </div>
    </Sublayout>
  );
};

export default NotificationsPage;
