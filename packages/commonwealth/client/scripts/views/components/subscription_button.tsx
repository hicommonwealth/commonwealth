import React, { useState } from 'react';

import { NotificationCategories } from '@hicommonwealth/core';
import { isNotUndefined } from 'helpers/typeGuards';

import app from 'state';
import { CWButton } from './component_kit/cw_button';

export const SubscriptionButton = () => {
  const subscriptions = app.user.notifications;
  const communitySubscription = subscriptions.findNotificationSubscription({
    categoryId: NotificationCategories.NewThread,
    options: { communityId: app.activeChainId() },
  });
  const [notificationsOn, setNotificationsOn] = useState<boolean>(
    isNotUndefined(communitySubscription),
  );

  return (
    <CWButton
      onClick={(e) => {
        e.preventDefault();
        if (isNotUndefined(communitySubscription)) {
          subscriptions
            .deleteSubscription(communitySubscription)
            .then(() => setNotificationsOn(false));
        } else {
          subscriptions
            .subscribe({
              categoryId: NotificationCategories.NewThread,
              options: {
                communityId: app.activeChainId(),
              },
            })
            .then(() => setNotificationsOn(true));
        }
      }}
      label={notificationsOn ? 'Notifications on' : 'Notifications off'}
      buttonType={notificationsOn ? 'primary-blue' : 'secondary-blue'}
    />
  );
};
