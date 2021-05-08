import 'mobile/mobile_sidebar.scss';

import m from 'mithril';
import app from 'state';
import SubscriptionButton from 'views/components/subscription_button';

import {
  OffchainNavigationModule,
  OnchainNavigationModule,
  ExternalLinksModule,
  ChainStatusModule
} from 'views/components/sidebar';
import { Tabs, TabItem } from 'construct-ui';
import { capitalize } from 'lodash';
import CommunitySelector from '../components/sidebar/community_selector';

enum MenuTabs {
  currentCommunity = 'currentCommunity',
  allCommunities = 'allCommunities'
}

const MobileSidebar: m.Component<{}, { activeTab: string }> = {
  oncreate: (vnode) => { vnode.state.activeTab = MenuTabs.currentCommunity; },
  view: (vnode) => {
    let { activeTab } = vnode.state;
    if (!activeTab) activeTab = MenuTabs.currentCommunity;
    const currentCommunityMenu = m('.currentCommunityMenu', [
      (app.chain || app.community) && m(OffchainNavigationModule),
      (app.chain || app.community) && m(OnchainNavigationModule),
      (app.chain || app.community) && m(ExternalLinksModule),
      m('br'),
      app.isLoggedIn() && (app.chain || app.community) && m(SubscriptionButton),
      app.chain && m(ChainStatusModule),
    ]);
    const allCommunitiesMenu = m('.allCommunitiesMenu', [
      m(CommunitySelector, { showListOnly: true, showHomeButtonAtTop: true })
    ]);
    return m('.MobileSidebar', [
      m(Tabs, [
        m(TabItem, {
          label: capitalize(app.activeId()),
          active: activeTab === MenuTabs.currentCommunity,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.activeTab = MenuTabs.currentCommunity;
          }
        }),
        m(TabItem, {
          label: 'Communities',
          active: activeTab === MenuTabs.allCommunities,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.activeTab = MenuTabs.allCommunities;
          }
        })
      ]),
      activeTab === MenuTabs.currentCommunity
        ? currentCommunityMenu
        : allCommunitiesMenu
    ]);
  }
};

export default MobileSidebar;
