/* eslint-disable no-unused-expressions */
import 'pages/discussions.scss';

import _ from 'lodash';
import m from 'mithril';

import app from 'state';
import { NotificationCategories } from 'types';

const DiscussionsSubscriptionButton = {
  view: (vnode) => {
    const subscriptions = app.login.notifications;
    const communitySubscription = subscriptions.subscriptions
      .find((v) => v.category === NotificationCategories.NewThread && v.objectId === app.activeId());
    const communityOrChain = app.activeChainId() ? app.activeChainId() : app.activeCommunityId();

    return m('a.btn.btn-block.DiscussionsSubscriptionButton', {
      class: communitySubscription ? 'formular-button-primary' : '',
      href: '#',
      onclick: (e) => {
        e.preventDefault();
        if (communitySubscription) {
          subscriptions.deleteSubscription(communitySubscription).then(() => m.redraw());
        } else {
          subscriptions.subscribe(NotificationCategories.NewThread, communityOrChain).then(() => m.redraw());
        }
      },
    }, [
      communitySubscription
        ? [ m('span.icon-bell'), ' Notifications on' ]
        : [ m('span.icon-bell-off'), ' Notifications off' ]
    ]);
  },
};

export default DiscussionsSubscriptionButton;
