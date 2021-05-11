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
import { Tabs, TabItem, Menu, MenuDivider, MenuItem, Icons, Dialog } from 'construct-ui';
import { capitalize } from 'lodash';
import CommunitySelector from '../components/sidebar/community_selector';
import { LoginSelectorMenuLeft, LoginSelectorMenuRight } from '../components/header/login_selector';
import { getNewProposalMenu } from '../components/new_proposal_button';

enum MenuTabs {
  currentCommunity = 'currentCommunity',
  allCommunities = 'allCommunities',
  account = 'account',
}

const MobileAccountMenu: m.Component<{}, { showNewThreadOptions: boolean }> = {
  view: (vnode) => {
    const isPrivateCommunity = app.community?.meta.privacyEnabled;
    const activeAddressesWithRole = app.user.activeAccounts.filter((account) => {
      return app.user.getRoleInCommunity({
        account,
        chain: app.activeChainId(),
        community: app.activeCommunityId()
      });
    });
    const activeAccountsByRole = app.user.getActiveAccountsByRole();
    const nAccountsWithoutRole = activeAccountsByRole.filter(([account, role], index) => !role).length;

    return m(Menu, { class: 'MobileAccountMenu' }, [
      m(Menu, { class: 'NewProposalMenu' }, [
        m(MenuItem, {
          label: 'New Thread',
          icon: Icons.PLUS,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.showNewThreadOptions = true;
          }
        })
      ]),
      m(Dialog, {
        content: getNewProposalMenu([], true)
      }),
      m(MenuDivider),
      m(LoginSelectorMenuLeft, {
        activeAddressesWithRole, nAccountsWithoutRole, isPrivateCommunity
      }),
      m(MenuDivider),
      m(LoginSelectorMenuRight)
    ]);
  }
}; 

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
        }),
        m(TabItem, {
          label: 'Account',
          active: activeTab === MenuTabs.account,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.activeTab = MenuTabs.account;
          }
        })
      ]),
      activeTab === MenuTabs.currentCommunity
        ? currentCommunityMenu
        : activeTab === MenuTabs.allCommunities
          ? allCommunitiesMenu
          : m(MobileAccountMenu)
    ]);
  }
};

export default MobileSidebar;
