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
import LoginModal from '../modals/login_modal';

enum MenuTabs {
  currentCommunity = 'currentCommunity',
  allCommunities = 'allCommunities',
  account = 'account',
}

const MobileAccountMenu: m.Component<{ onclick }, {}> = {
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

    return m(Menu, { class: 'MobileAccountMenu' }, [
      app.activeId() && m(LoginSelectorMenuLeft, {
        activeAddressesWithRole, nAccountsWithoutRole, isPrivateCommunity
      }),
      app.activeId() && m(MenuDivider),
      m(LoginSelectorMenuRight, { onclick: vnode.attrs.onclick })
    ]);
  }
};

const MobileSidebar: m.Component<{ onclick }, { activeTab: string, showNewThreadOptions: boolean }> = {
  oncreate: (vnode) => {
    vnode.state.activeTab = MenuTabs.currentCommunity;
    window.scrollTo(0, Number(localStorage['home-scrollY']));
  },
  view: (vnode) => {
    if (!app) return;
    let { activeTab } = vnode.state;
    const { showNewThreadOptions } = vnode.state;
    if (!activeTab) activeTab = app.activeId()
      ? MenuTabs.currentCommunity
      : MenuTabs.account;
    const CurrentCommunityMenu = m(Menu, { class: 'CurrentCommunityMenu' }, [
      app.isLoggedIn()
        ? m(Menu, { class: 'NewProposalMenu' }, [
          m(MenuItem, {
            label: 'Create New',
            iconLeft: Icons.PLUS,
            onclick: (e) => {
              e.stopPropagation();
              vnode.state.showNewThreadOptions = !showNewThreadOptions;
            }
          }),
          showNewThreadOptions
          && getNewProposalMenu([], true)
        ])
        : m(MenuItem, {
          label: 'Login',
          iconLeft: Icons.LOG_IN,
          onclick: (e) => {
            if (vnode.attrs.onclick) vnode.attrs.onclick();
            app.modals.create({ modal: LoginModal });
          }
        }),
      m(MenuDivider),
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
        app.activeId() && m(TabItem, {
          label: capitalize(app.activeId()),
          active: activeTab === MenuTabs.currentCommunity,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.activeTab = MenuTabs.currentCommunity;
          }
        }),
        app.activeId() && m(TabItem, {
          label: 'Communities',
          active: activeTab === MenuTabs.allCommunities,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.activeTab = MenuTabs.allCommunities;
          }
        }),
        app.isLoggedIn()
        && m(TabItem, {
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
          : m(MobileAccountMenu, { onclick: vnode.attrs.onclick })
    ]);
  }
};

export default MobileSidebar;
