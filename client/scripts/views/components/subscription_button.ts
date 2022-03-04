/* eslint-disable @typescript-eslint/ban-types */
import m from 'mithril';

import app from 'state';
import { NotificationCategories } from 'types';
import { CWButton } from './component_kit/cw_button';

const SubscriptionButton: m.Component<{}> = {
  view: (vnode) => {
    const subscriptions = app.user.notifications;
    const communitySubscription = subscriptions.subscriptions.find(
      (v) =>
        v.category === NotificationCategories.NewThread &&
        v.objectId === app.activeChainId()
    );
    const communityOrChain = app.activeChainId();

    return m(CWButton, {
      onclick: (e) => {
        e.preventDefault();
        if (communitySubscription) {
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
      },
      label: communitySubscription ? 'Notifications on' : 'Notifications off',
      buttonType: communitySubscription ? 'primary' : 'secondary',
    });
  },
};

export default SubscriptionButton;
