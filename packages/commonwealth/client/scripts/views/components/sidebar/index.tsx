/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import { Action } from 'common-common/src/permissions';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { ContractsViewable } from 'common-common/src/types';
import { isActiveAddressPermitted } from 'controllers/server/roles';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ContractSection } from './contract_section';
import { ExternalLinksModule } from './external_links_module';
import { ChatSection } from '../chat/chat_section';
import { AdminSection } from './admin_section';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { getClasses } from '../component_kit/helpers';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWText } from '../component_kit/cw_text';

type SidebarAttrs = {
  isSidebarToggleable?: boolean;
  isSidebarToggled?: boolean;
};

export class Sidebar implements m.ClassComponent<SidebarAttrs> {
  view(vnode: m.Vnode<SidebarAttrs>) {
    const { isSidebarToggleable, isSidebarToggled } = vnode.attrs;
    const isAdmin = app.roles.isAdminOfEntity({ chain: app.activeChainId() });
    const contractsViewable = app.config.chains.getById(
      app.activeChainId()
    )?.contractsViewable;
    const isContractsViewable =
      (contractsViewable === ContractsViewable.AdminOnly && isAdmin) ||
      contractsViewable === ContractsViewable.AllUsers;

    const activeAddressRoles = app.roles.getAllRolesInCommunity({
      chain: app.activeChainId(),
    });

    const currentChainInfo = app.chain?.meta;

    const hideChat =
      !currentChainInfo ||
      !activeAddressRoles ||
      !isActiveAddressPermitted(
        activeAddressRoles,
        currentChainInfo,
        Action.VIEW_CHAT_CHANNELS
      );

    const showQuickSwitcher = isSidebarToggleable ? isSidebarToggled : true;

    return (
      <div class="Sidebar">
        {app.chain && isSidebarToggleable && isSidebarToggled && (
          <div class="CommunityHeader">
            <div class="inner-container">
              <CWCommunityAvatar size="large" community={app.chain.meta} />
              <CWText type="h5" fontStyle="medium">
                {app.chain.meta.name}
              </CWText>
            </div>
          </div>
        )}
        <div class="quickswitcher-and-sidebar-inner">
          {showQuickSwitcher && <SidebarQuickSwitcher />}
          {app.chain && (
            <div
              class={getClasses<{
                isSidebarToggleable: boolean;
                isSidebarToggled: boolean;
              }>({ isSidebarToggleable, isSidebarToggled }, 'sidebar-inner')}
            >
              <AdminSection />
              <DiscussionSection />
              <GovernanceSection />
              {isContractsViewable && <ContractSection />}
              {app.socket && !hideChat && <ChatSection />}
              <ExternalLinksModule />
              <div class="buttons-container">
                {app.isLoggedIn() && app.chain && (
                  <div class="subscription-button">
                    <SubscriptionButton />
                  </div>
                )}
                {app.isCustomDomain() && (
                  <div
                    class="powered-by"
                    onclick={() => {
                      window.open('https://commonwealth.im/');
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
