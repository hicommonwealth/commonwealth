import React, { useEffect } from 'react';
import { NotificationCategories } from 'common-common/src/types';
import type Notification from '../../../models/Notification';

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

  const { category } = notification.subscription;

  if (category === NotificationCategories.ChainEvent) {
    return (
      <ChainEventNotificationRow
        notification={notification}
        onListPage={onListPage}
      />
    );
  } else if (category === NotificationCategories.SnapshotProposal) {
    return <SnapshotNotificationRow notification={notification} />;
  } else {
    return <DefaultNotificationRow notification={notification} />;
  }
};
