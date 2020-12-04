import _ from 'lodash';
import m from 'mithril';

import app from 'state';
import { link } from 'helpers';
import { NotificationCategories } from 'types';
import { Button, Icon, Icons, PopoverMenu, MenuItem } from 'construct-ui';

const SubscriptionButton: m.Component<{}> = {
  view: (vnode) => {
    const subscriptions = app.user.notifications;
    const communitySubscription = subscriptions.subscriptions
      .find((v) => v.category === NotificationCategories.NewThread && v.objectId === app.activeId());
    const communityOrChain = app.activeChainId() ? app.activeChainId() : app.activeCommunityId();

    return m('.SubscriptionButton', [
      m('.subscription-button-header', 'New thread notifications'),
      m(Button, {
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
        size: 'sm',
        fluid: true,
        label: communitySubscription ? 'Notifications on' : 'Notifications off',
        intent: communitySubscription ? 'primary' : 'none',
      }),
      m('.subscription-button-sub', [
        !communitySubscription
          ? 'You will not be notified of new threads'
          : (app.user.emailInterval === 'daily' && !app.user.email)
            ? [
              'You will be notified in the app. ',
              link('a', `${app.activeId()}/settings`, 'Add an email'),
            ]
            : (app.user.emailInterval === 'daily' && communitySubscription.immediateEmail)
              ? [
                'You will be notified in the app & immediately by email. ',
                link('a', `${app.activeId()}/notifications`, 'Manage'),
              ]
              : app.user.emailInterval === 'daily'
                ? [
                  'You will be notified in the app & daily emails. ',
                  link('a', `${app.activeId()}/notifications`, 'Manage'),
                ]
                : app.user.emailInterval === 'never' ? [
                  'You will be notified in the app. ',
                  link('a', `${app.activeId()}/notifications`, 'Manage'),
                ] : '',
      ]),
    ]);
  },
};

export default SubscriptionButton;
