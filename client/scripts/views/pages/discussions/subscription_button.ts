import _ from 'lodash';
import m from 'mithril';

import app from 'state';
import { NotificationCategories } from 'types';
import { Button, Icon, Icons, PopoverMenu, MenuItem } from 'construct-ui';

const DiscussionsSubscriptionButton = {
  view: (vnode) => {
    const subscriptions = app.login.notifications;
    const communitySubscription = subscriptions.subscriptions
      .find((v) => v.category === NotificationCategories.NewThread && v.objectId === app.activeId());
    const communityOrChain = app.activeChainId() ? app.activeChainId() : app.activeCommunityId();

    return m(Button, {
      intent: communitySubscription ? 'primary' : 'none',
      onclick: (e) => {
        e.preventDefault();
        communitySubscription ?
          subscriptions.deleteSubscription(communitySubscription).then(() => m.redraw()) :
          subscriptions.subscribe(NotificationCategories.NewThread, communityOrChain).then(() => m.redraw());
      },
      label: communitySubscription ? 'New thread notifications on' : 'New thread notifications off',
      iconLeft: communitySubscription ? Icons.BELL : Icons.BELL_OFF,
    });
  },
};

export default DiscussionsSubscriptionButton;
