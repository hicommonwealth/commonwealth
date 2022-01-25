import 'mobile/mobile_sidebar.scss';

import m from 'mithril';
import app from 'state';
import SubscriptionButton from 'views/components/subscription_button';

import Sidebar, {
  ExternalLinksModule,
} from 'views/components/sidebar';
import { Tabs, TabItem, Menu, MenuDivider, MenuItem, Icons, Dialog } from 'construct-ui';
import { capitalize } from 'lodash';
import CommunitySelector from '../components/sidebar/community_selector';
import { LoginSelectorMenuLeft, LoginSelectorMenuRight } from '../components/header/login_selector';
import { getNewProposalMenu } from '../components/new_proposal_button';
import LoginModal from '../modals/login_modal';
import { DiscussionSection } from '../components/sidebar/discussion_section';
import { GovernanceSection } from '../components/sidebar/governance_section';

enum MenuTabs {
  currentCommunity = 'currentCommunity',
  allCommunities = 'allCommunities',
  account = 'account',
}

const MobileAccountMenu: m.Component<{}, {}> = {
  view: (vnode) => {
    if (!app.isLoggedIn) return;
    const activeAddressesWithRole = app.user.activeAccounts.filter((account) => {
      return app.user.getRoleInCommunity({
        account,
        chain: app.activeChainId(),
      });
    });
    const activeAccountsByRole = app.user.getActiveAccountsByRole();
    const nAccountsWithoutRole = activeAccountsByRole.filter(([account, role], index) => !role).length;
    return m(Menu, { class: 'MobileAccountMenu' },
      app.isLoggedIn()
        ? [
          app.activeChainId() && m(LoginSelectorMenuLeft, {
            activeAddressesWithRole,
            nAccountsWithoutRole,
            mobile: true
          }),
          app.activeChainId() && m(MenuDivider),
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
    if (!app.activeChainId() && !app.activeChainId()) {
      vnode.state.activeTab = MenuTabs.account;
    }
    if (!activeTab) activeTab = app.activeChainId()
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
            app.modals.create({ modal: LoginModal });
          }
        }),
      m(MenuDivider),
      (app.chain) && m(DiscussionSection, {mobile: true}),
      (app.chain) && m(GovernanceSection, {mobile: true}),
      m('.br', {style: 'height: 10px'}),
      (app.chain) && m(ExternalLinksModule),
    ]);
    const AllCommunitiesMenu = m(Menu, { class: 'AllCommunitiesMenu' }, [
      m(CommunitySelector, { showListOnly: true, showHomeButtonAtTop: true })
    ]);
    return m('.MobileSidebar', [
      m(Tabs, [
        app.activeChainId()
        && m(TabItem, {
          label: capitalize(app.activeChainId()),
          active: activeTab === MenuTabs.currentCommunity,
          onclick: (e) => {
            e.stopPropagation();
            vnode.state.activeTab = MenuTabs.currentCommunity;
          }
        }),
        app.activeChainId()
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
