import { NotificationCategories } from '@hicommonwealth/shared';
import React, { useEffect } from 'react';
import type Notification from '../../../models/Notification';

import {
  ChainEventNotificationRow,
  DefaultNotificationRow,
  SnapshotNotificationRow,
} from './notification_row_components';

export type NotificationRowProps = {
  notification: Notification;
  onListPage?: boolean;
  allRead: boolean;
};

export const NotificationRow = (props: NotificationRowProps) => {
  const { notification, onListPage, allRead } = props;

  const [markingRead, setMarkingRead] = React.useState<boolean>(false);

  const handleSetMarkingRead = (isMarkingRead: boolean) => {
    setMarkingRead(isMarkingRead);
  };

  useEffect(() => setMarkingRead(allRead), [allRead]);

  const category = notification.categoryId;

  if (category === NotificationCategories.ChainEvent) {
    return (
      <ChainEventNotificationRow
        notification={notification}
        onListPage={onListPage}
      />
    );
  } else if (category === NotificationCategories.SnapshotProposal) {
    return (
      <SnapshotNotificationRow
        notification={notification}
        handleSetMarkingRead={handleSetMarkingRead}
        markingRead={markingRead}
        allRead={allRead}
      />
    );
  } else {
    return (
      <DefaultNotificationRow
        notification={notification}
        handleSetMarkingRead={handleSetMarkingRead}
        markingRead={markingRead}
        allRead={allRead}
      />
    );
  }
};
