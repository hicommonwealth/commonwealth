/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { ContractsViewable } from 'common-common/src/types';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ContractSection } from './contract_section';
import { ExternalLinksModule } from './external_links_module';
import { ChatSection } from '../chat/chat_section';
import { AdminSection } from './admin_section';

export class Sidebar implements m.ClassComponent {
  view() {
    const isAdmin = app.roles.isAdminOfEntity({ chain: app.activeChainId() });
    const contractsViewable = app.config.chains.getById(app.activeChainId())?.contractsViewable;
    const isContractsViewable = (contractsViewable === ContractsViewable.AdminOnly && isAdmin)
    || contractsViewable === ContractsViewable.AllUsers;
    const hideChat = !app.chain.meta.chatEnabled;

    return (
      <div class="Sidebar">
        <AdminSection />
        <DiscussionSection />
        <GovernanceSection />
        {isContractsViewable && <ContractSection/>}
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
    );
  }
}
