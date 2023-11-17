import React, { useState } from 'react';

import { NotificationCategories } from 'common-common/src/types';
import { isNotUndefined } from 'helpers/typeGuards';

import app from 'state';
import { trpc } from '../../utils/trpc';
import { CWButton } from './component_kit/cw_button';

export const SubscriptionButton = () => {
  const subscriptions = app.user.notifications;
  const communitySubscription = subscriptions.findNotificationSubscription({
    categoryId: NotificationCategories.NewThread,
    options: { chainId: app.activeChainId() },
  });
  const [notificationsOn, setNotificationsOn] = useState<boolean>(
    isNotUndefined(communitySubscription),
  );
  const createSubscriptionMutation =
    trpc.Subscription.createSubscription.useMutation();

  return (
    <CWButton
      disabled={createSubscriptionMutation.isLoading}
      onClick={(e) => {
        e.preventDefault();
        if (isNotUndefined(communitySubscription)) {
          subscriptions
            .deleteSubscription(communitySubscription)
            .then(() => setNotificationsOn(false));
        } else {
          createSubscriptionMutation.mutate({
            category: NotificationCategories.NewThread,
            chain_id: app.activeChainId(),
          });
          setNotificationsOn(true);
        }
      }}
      label={notificationsOn ? 'Notifications on' : 'Notifications off'}
      buttonType={notificationsOn ? 'primary-blue' : 'secondary-blue'}
    />
  );
};
