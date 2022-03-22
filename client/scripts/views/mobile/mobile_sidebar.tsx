/* @jsx m */

import m from 'mithril';
import {
  Icons,
  Menu,
  MenuDivider,
  MenuItem,
  TabItem,
  Tabs,
} from 'construct-ui';
import { capitalize } from 'lodash';

import 'mobile/mobile_sidebar.scss';

import app from 'state';
import { DiscussionSection } from 'views/components/sidebar/discussion_section';
import { GovernanceSection } from 'views/components/sidebar/governance_section';
import { ExternalLinksModule } from 'views/components/sidebar';
import CommunitySelector from 'views/components/sidebar/community_selector';
import {
  LoginSelectorMenuLeft,
  LoginSelectorMenuRight,
} from 'views/components/header/login_selector';
import { getNewProposalMenu } from 'views/components/new_proposal_button';
import LoginModal from '../modals/login_modal';

enum MenuTabs {
  CurrentCommunity = 'currentCommunity',
  AllCommunities = 'allCommunities',
  Account = 'account',
}

class MobileAccountMenu implements m.ClassComponent {
  view() {
    const activeAddressesWithRole = app.user.activeAccounts.filter(
      (account) => {
        return app.user.getRoleInCommunity({
          account,
          chain: app.activeChainId(),
        });
      }
    );

    const activeAccountsByRole = app.user.getActiveAccountsByRole();

    const nAccountsWithoutRole = activeAccountsByRole.filter(
      ([role]) => !role
    ).length;

    return (
      <Menu class="MobileAccountMenu">
        {app.isLoggedIn() ? (
          <>
            {app.activeChainId() &&
              m(LoginSelectorMenuLeft, {
                activeAddressesWithRole,
                nAccountsWithoutRole,
                mobile: true,
              })}
            {app.activeChainId() && <MenuDivider />}
            {m(LoginSelectorMenuRight, { mobile: true })}
          </>
        ) : (
          <MenuItem
            label="Login"
            iconLeft={Icons.LOG_IN}
            onclick={() => {
              app.modals.create({ modal: LoginModal });
            }}
          />
        )}
      </Menu>
    );
  }
}

export class MobileSidebar implements m.ClassComponent {
  private activeTab: string;
  private showNewThreadOptions: boolean;

  oninit() {
    if (app && !app.activeChainId()) {
      this.activeTab = MenuTabs.Account;
    } else {
      this.activeTab = app.activeChainId()
        ? MenuTabs.CurrentCommunity
        : MenuTabs.Account;
    }
  }

  view() {
    const CurrentCommunityMenu = (
      <Menu class="CurrentCommunityMenu">
        {app.isLoggedIn() ? (
          <Menu class="NewProposalMenu">
            <MenuItem
              label="Create New"
              iconLeft={Icons.PLUS}
              onclick={(e) => {
                e.stopPropagation();
                this.showNewThreadOptions = !this.showNewThreadOptions;
              }}
            />
            {this.showNewThreadOptions && getNewProposalMenu([], true)}
          </Menu>
        ) : (
          <MenuItem
            label="Login"
            iconLeft={Icons.LOG_IN}
            onclick={() => {
              app.modals.create({ modal: LoginModal });
            }}
          />
        )}
        <MenuDivider />
        {app.chain && m(DiscussionSection, { mobile: true })}
        {app.chain && m(GovernanceSection, { mobile: true })}
        {app.chain && m(ExternalLinksModule)}
      </Menu>
    );

    return (
      <div class="MobileSidebar">
        <Tabs>
          {app.activeChainId() && (
            <TabItem
              label={capitalize(app.activeChainId())}
              active={this.activeTab === MenuTabs.CurrentCommunity}
              onclick={(e) => {
                e.stopPropagation();
                this.activeTab = MenuTabs.CurrentCommunity;
              }}
            />
          )}
          {app.activeChainId() && (
            <TabItem
              label="Communities"
              active={this.activeTab === MenuTabs.AllCommunities}
              onclick={(e) => {
                e.stopPropagation();
                this.activeTab = MenuTabs.AllCommunities;
              }}
            />
          )}
          <TabItem
            label="Account"
            active={this.activeTab === MenuTabs.Account}
            onclick={(e) => {
              e.stopPropagation();
              this.activeTab = MenuTabs.Account;
            }}
          />
        </Tabs>
        {this.activeTab === MenuTabs.CurrentCommunity ? (
          CurrentCommunityMenu
        ) : this.activeTab === MenuTabs.AllCommunities ? (
          <Menu class="AllCommunitiesMenu">
            {m(CommunitySelector, {
              showListOnly: true,
              showHomeButtonAtTop: true,
            })}
          </Menu>
        ) : (
          <MobileAccountMenu />
        )}
      </div>
    );
  }
}
