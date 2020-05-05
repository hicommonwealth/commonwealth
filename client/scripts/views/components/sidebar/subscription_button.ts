import _ from 'lodash';
import m from 'mithril';

import app from 'state';
import { NotificationCategories } from 'types';
import { Button, Icon, Icons, PopoverMenu, MenuItem } from 'construct-ui';

const SubscriptionButton = {
  view: (vnode) => {
    const subscriptions = app.login.notifications;
    const communitySubscription = subscriptions.subscriptions
      .find((v) => v.category === NotificationCategories.NewThread && v.objectId === app.activeId());
    const communityOrChain = app.activeChainId() ? app.activeChainId() : app.activeCommunityId();

    return m(PopoverMenu, {
      transitionDuration: 0,
      closeOnContentClick: true,
      menuAttrs: { size: 'sm', },
      content: m(MenuItem, {
        onclick: (e) => {
          e.preventDefault();
          if (communitySubscription) {
            subscriptions.deleteSubscription(communitySubscription).then(() => {
              m.redraw();
            });
          } else {
            subscriptions.subscribe(NotificationCategories.NewThread, communityOrChain).then(() => {
              m.redraw();
            });
          }
        },
        label: communitySubscription ? 'Turn off notifications' : 'Turn on notifications',
      }),
      trigger: m(Icon, { name: Icons.CHEVRON_DOWN, class: 'SubscriptionButton' }),
    });
  },
};

export default SubscriptionButton;
