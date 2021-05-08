import 'components/sidebar/mobile.scss';

import m from 'mithril';
import app from 'state';
import SubscriptionButton from 'views/components/subscription_button';

import {
  OffchainNavigationModule,
  OnchainNavigationModule,
  ExternalLinksModule,
  ChainStatusModule
} from 'views/components/sidebar';
import { TabItem } from 'construct-ui';
import Tabs from '../components/widgets/tabs';
import CommunitySelector from '../components/sidebar/community_selector';

enum MenuTabs {
  currentCommunity = 'currentCommunity',
  allCommunities = 'allCommunities'
}

const MobileSidebar: m.Component<{}, { activeTab: string }> = {
  view: (vnode) => {
    const { activeTab } = vnode.state;
    return m(Tabs, {
      class: 'MobileSidebar'
    }, [
      m(TabItem, {
        label: app.activeId(),
        active: activeTab === MenuTabs.currentCommunity,
        onclick: (e) => { vnode.state.activeTab = MenuTabs.currentCommunity; }
      }, [
        (app.chain || app.community) && m(OffchainNavigationModule),
        (app.chain || app.community) && m(OnchainNavigationModule),
        (app.chain || app.community) && m(ExternalLinksModule),
        m('br'),
        app.isLoggedIn() && (app.chain || app.community) && m(SubscriptionButton),
        app.chain && m(ChainStatusModule),
      ]),
      m(TabItem, {
        label: 'Communities',
        active: activeTab === MenuTabs.allCommunities,
        onclick: (e) => { vnode.state.activeTab = MenuTabs.allCommunities; }
      }, [
        m(CommunitySelector, { showListOnly: true })
      ])
    ]);
  }
};

export default MobileSidebar;
