import 'pages/discussions/sidebar.scss';

import m from 'mithril';

import app from 'state';
import CommunityInfoModule from 'views/components/sidebar/community_info_module';
import SubscriptionButton from 'views/components/sidebar/subscription_button';

export const ListingSidebar: m.Component<{ entity: string }> = {
  view: (vnode) => {
    return m('.ListingSidebar.forum-container.proposal-sidebar', [
      m(CommunityInfoModule),
      m(SubscriptionButton),
    ]);
  }
};
