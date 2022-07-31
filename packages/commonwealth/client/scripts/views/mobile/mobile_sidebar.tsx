/* @jsx m */

import m from 'mithril';
import { Icons, Menu, MenuDivider, MenuItem } from 'construct-ui';
import { capitalize } from 'lodash';

import 'mobile/mobile_sidebar.scss';

import app from 'state';
import { DiscussionSection } from 'views/components/sidebar/discussion_section';
import { GovernanceSection } from 'views/components/sidebar/governance_section';
import {
  LoginSelectorMenuLeft,
  LoginSelectorMenuRight,
} from 'views/components/header/login_selector';
import { NewProposalMenu } from 'views/components/new_proposal_button';
import { LoginModal } from '../modals/login_modal';
import { ExternalLinksModule } from '../components/sidebar/external_links_module';
import { CommunitySelector } from '../components/sidebar/community_selector';
import { ChatSection } from '../components/chat/chat_section';
import { CWTabBar, CWTab } from '../components/component_kit/cw_tabs';

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
            {app.activeChainId() && (
              <LoginSelectorMenuLeft
                activeAddressesWithRole={activeAddressesWithRole}
                nAccountsWithoutRole={nAccountsWithoutRole}
                mobile={true}
              />
            )}
            {app.activeChainId() && <MenuDivider />}
            <LoginSelectorMenuRight mobile={true} />
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
            {this.showNewThreadOptions && (
              <NewProposalMenu candidates={[]} mobile={true} />
            )}
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
        {app.chain && <DiscussionSection mobile={true} />}
        {app.chain && <GovernanceSection mobile={true} />}
        {app.chain && <ChatSection mobile={true} />}
        {app.chain && <ExternalLinksModule />}
      </Menu>
    );

    return (
      <div class="MobileSidebar">
        <CWTabBar>
          {app.activeChainId() && (
            <CWTab
              label={capitalize(app.activeChainId())}
              isSelected={this.activeTab === MenuTabs.CurrentCommunity}
              onclick={(e) => {
                e.stopPropagation();
                this.activeTab = MenuTabs.CurrentCommunity;
              }}
            />
          )}
          {app.activeChainId() && (
            <CWTab
              label="Communities"
              isSelected={this.activeTab === MenuTabs.AllCommunities}
              onclick={(e) => {
                e.stopPropagation();
                this.activeTab = MenuTabs.AllCommunities;
              }}
            />
          )}
          <CWTab
            label="Account"
            isSelected={this.activeTab === MenuTabs.Account}
            onclick={(e) => {
              e.stopPropagation();
              this.activeTab = MenuTabs.Account;
            }}
          />
        </CWTabBar>
        {this.activeTab === MenuTabs.CurrentCommunity ? (
          CurrentCommunityMenu
        ) : this.activeTab === MenuTabs.AllCommunities ? (
          <Menu>
            <CommunitySelector isMobile={true} />
          </Menu>
        ) : (
          <MobileAccountMenu />
        )}
      </div>
    );
  }
}
