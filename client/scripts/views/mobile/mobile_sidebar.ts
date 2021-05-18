import 'mobile/mobile_sidebar.scss';

import m from 'mithril';
import app from 'state';
import SubscriptionButton from 'views/components/subscription_button';
import NewProposalButton from 'views/components/new_proposal_button';

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
import LoginModal from '../modals/login_modal';

enum MenuTabs {
  currentCommunity = 'currentCommunity',
  allCommunities = 'allCommunities',
  account = 'account',
}

const MobileAccountMenu: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.isLoggedIn) return;
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
    return m(Menu, { class: 'MobileAccountMenu' },
      app.isLoggedIn()
        ? [
          app.activeId() && m(LoginSelectorMenuLeft, {
            activeAddressesWithRole,
            nAccountsWithoutRole,
            isPrivateCommunity,
            mobile: true
          }),
          app.activeId() && m(MenuDivider),
          m(LoginSelectorMenuRight, { mobile: true })
        ]
        : m(MenuItem, {
          label: 'Login',
          iconLeft: Icons.LOG_IN,
          onclick: (e) => {
            app.modals.create({ modal: LoginModal });
          }
        }));
  }
};

const MobileSidebar: m.Component<{}, { activeTab: string, showNewThreadOptions: boolean }> = {
  view: (vnode) => {
    if (!app) return;
    let { activeTab } = vnode.state;
    const { showNewThreadOptions } = vnode.state;
    if (!app.activeId() && !app.activeId()) {
      vnode.state.activeTab = MenuTabs.account;
    }
    if (!activeTab) activeTab = app.activeId()
      ? MenuTabs.currentCommunity
      : MenuTabs.account;
    const CurrentCommunityMenu = m(Menu, { class: 'CurrentCommunityMenu' }, [
      app.isLoggedIn()
        ? m(NewProposalButton, { fluid: true, rounded: true, basic: true })
        : m(MenuItem, {
          label: 'Login',
          iconLeft: Icons.LOG_IN,
          onclick: (e) => {
            app.modals.create({ modal: LoginModal });
          }
        }),
      (app.chain || app.community) && m(OffchainNavigationModule),
      (app.chain || app.community) && m(OnchainNavigationModule),
      (app.chain || app.community) && m(ExternalLinksModule),
      app.isLoggedIn() && (app.chain || app.community) && m(SubscriptionButton),
      app.chain && m(ChainStatusModule),
    ]);
    const AllCommunitiesMenu = m(Menu, { class: 'AllCommunitiesMenu' }, [
      m(CommunitySelector, { showListOnly: true, showHomeButtonAtTop: true })
    ]);
    return m('.MobileSidebar', [
      m(Tabs, [
        app.activeId()
        && m(TabItem, {
          label: capitalize(app.activeId()),
          active: activeTab === MenuTabs.currentCommunity,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.activeTab = MenuTabs.currentCommunity;
          }
        }),
        app.activeId()
        && m(TabItem, {
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
        ? CurrentCommunityMenu
        : activeTab === MenuTabs.allCommunities
          ? AllCommunitiesMenu
          : m(MobileAccountMenu)
    ]);
  }
};

export default MobileSidebar;
