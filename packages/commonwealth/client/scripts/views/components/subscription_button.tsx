import React, { useState } from 'react';

import { NotificationCategories } from '@hicommonwealth/shared';
import { isNotUndefined } from 'helpers/typeGuards';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';

import app from 'state';

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
      buttonHeight="sm"
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
      buttonType={notificationsOn ? 'primary' : 'secondary'}
    />
  );
};
