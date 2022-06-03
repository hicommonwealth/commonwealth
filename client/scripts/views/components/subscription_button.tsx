/* @jsx m */

import { isNotUndefined } from 'helpers/typeGuards';
import m from 'mithril';

import app from 'state';
import { NotificationCategories } from 'types';
import { CWButton } from './component_kit/cw_button';

export class SubscriptionButton implements m.ClassComponent {
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
        onclick={(e) => {
          e.preventDefault();
          if (isNotUndefined(communitySubscription)) {
            subscriptions.deleteSubscription(communitySubscription).then(() => {
              m.redraw();
            });
          } else {
            subscriptions
              .subscribe(NotificationCategories.NewThread, communityOrChain)
              .then(() => {
                m.redraw();
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
