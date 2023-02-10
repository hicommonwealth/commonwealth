import React from 'react';

import { NotificationCategories } from 'common-common/src/types';
import { isNotUndefined } from 'helpers/typeGuards';

import app from 'state';
import { CWButton } from './component_kit/cw_button';

export const SubscriptionButton = () => {
  const subscriptions = app.user.notifications;
  const communitySubscription = subscriptions.subscriptions.find(
    (v) =>
      v.category === NotificationCategories.NewThread &&
      v.objectId === app.activeChainId()
  );
  const communityOrChain = app.activeChainId();

  return (
    <CWButton
      onClick={(e) => {
        e.preventDefault();
        if (isNotUndefined(communitySubscription)) {
          subscriptions.deleteSubscription(communitySubscription);
        } else {
          subscriptions.subscribe(
            NotificationCategories.NewThread,
            communityOrChain
          );
        }
      }}
      label={
        isNotUndefined(communitySubscription)
          ? 'Notifications on'
          : 'Notifications off'
      }
      buttonType={
        isNotUndefined(communitySubscription)
          ? 'primary-blue'
          : 'secondary-blue'
      }
    />
  );
};
