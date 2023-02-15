import React from 'react';
import { Virtuoso } from 'react-virtuoso';
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

  const allNotifications = discussionNotifications.concat(
    chainEventNotifications
  );

  return (
    <Sublayout>
      <div className="NotificationsPage">
        <div className="notifications-buttons-row">
          <CWButton
            label="Mark all as read"
            onClick={(e) => {
              e.preventDefault();
              app.user.notifications.markAsRead(allNotifications);
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
                        app.user.notifications.delete(
                          app.user.notifications.chainEventNotifications
                        );
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
          {allNotifications.length > 0 ? (
            <Virtuoso
              style={{ height: '400px' }}
              data={allNotifications}
              itemContent={(i, data) => (
                <NotificationRow key={i} notification={data} onListPage />
              )}
            />
          ) : (
            <div className="no-notifications">
              <CWText>No Notifications</CWText>
            </div>
          )}
        </div>
      </div>
    </Sublayout>
  );
};

export default NotificationsPage;
