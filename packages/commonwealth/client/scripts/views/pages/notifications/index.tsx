import { byDescendingCreationDate } from 'helpers';
import 'pages/notifications/index.scss';
import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import app from 'state';
import PageError from 'views/pages/error';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/cw_button';
import { NotificationRow } from './notification_row';

const NotificationsPage = () => {
  const [allRead, setAllRead] = useState<boolean>(false);

  if (!app.isLoggedIn()) {
    return <PageError message="This page requires you to be signed in." />;
  }

  const discussionNotifications =
    app.user.notifications.discussionNotifications;
  const chainEventNotifications =
    app.user.notifications.chainEventNotifications;

  const mostRecentFirst = [
    ...discussionNotifications.concat(chainEventNotifications),
  ].sort(byDescendingCreationDate);

  return (
    <div className="NotificationsPage">
      <CWText type="h2" fontWeight="medium">
        Notifications
      </CWText>
      <div className="notifications-buttons-row">
        <CWButton
          label="Mark all as read"
          onClick={(e) => {
            e.preventDefault();
            app.user.notifications.markAsRead(mostRecentFirst);
            setAllRead(true);
          }}
        />
        <CWButton
          label="Clear chain events"
          onClick={async (e) => {
            e.preventDefault();

            if (app.user.notifications.chainEventNotifications.length === 0) {
              return;
            }

            app.user.notifications.delete(
              app.user.notifications.chainEventNotifications,
            );
          }}
        />
      </div>
      <div className="NotificationsList">
        {mostRecentFirst.length > 0 ? (
          <Virtuoso
            style={{ height: '100%' }}
            data={mostRecentFirst}
            itemContent={(i, data) => (
              <NotificationRow
                key={i}
                notification={data}
                onListPage
                allRead={allRead}
              />
            )}
          />
        ) : (
          <div className="no-notifications">
            <CWText>No Notifications</CWText>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
