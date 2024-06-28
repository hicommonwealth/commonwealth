import { byDescendingCreationDate } from 'helpers';
import React, { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import app from 'state';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { NotificationRow } from 'views/pages/notifications/notification_row';

export const OldContent = () => {
  const [allRead, setAllRead] = useState<boolean>(false);

  const discussionNotifications =
    app.user.notifications.discussionNotifications;
  const chainEventNotifications =
    app.user.notifications.chainEventNotifications;

  const mostRecentFirst = [
    ...discussionNotifications.concat(chainEventNotifications),
  ].sort(byDescendingCreationDate);

  return (
    <>
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
    </>
  );
};
