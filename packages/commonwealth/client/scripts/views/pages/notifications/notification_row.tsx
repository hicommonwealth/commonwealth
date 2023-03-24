import React from 'react';

import type { Notification } from 'models';
import { NotificationCategories } from 'common-common/src/types';

import {
  ChainEventNotificationRow,
  DefaultNotificationRow,
  SnapshotNotificationRow,
} from './notification_row_components';

export type NotificationRowProps = {
  notification: Notification;
  onListPage?: boolean;
};

export const NotificationRow = (props: NotificationRowProps) => {
  const { notification, onListPage } = props;

  const [markingRead, setMarkingRead] = React.useState<boolean>(false);

  const handleSetMarkingRead = (isMarkingRead: boolean) => {
    setMarkingRead(isMarkingRead);
  };

  const { category } = notification.subscription;

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
      />
    );
  } else {
    return (
      <DefaultNotificationRow
        notification={notification}
        handleSetMarkingRead={handleSetMarkingRead}
        markingRead={markingRead}
      />
    );
  }
};
