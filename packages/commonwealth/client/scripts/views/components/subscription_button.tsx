import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';
import { NotificationCategories } from 'common-common/src/types';
import { isNotUndefined } from 'helpers/typeGuards';

import app from 'state';
import { CWButton } from './component_kit/cw_button';

export class SubscriptionButton extends ClassComponent {
  view() {
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
            subscriptions.deleteSubscription(communitySubscription).then(() => {
              redraw();
            });
          } else {
            subscriptions
              .subscribe(NotificationCategories.NewThread, communityOrChain)
              .then(() => {
                redraw();
              });
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
  }
}
