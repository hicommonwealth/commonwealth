/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ExternalLinksModule } from './external_links_module';
import { ChatSection } from '../chat/chat_section';

export class Sidebar implements m.ClassComponent {
  view() {
    const hideChat = ['terra', 'axie'].includes(app.activeChainId());
    return app.chain ? (
      <div class="Sidebar">
        <DiscussionSection />
        <GovernanceSection />
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
    ) : null;
  }
}
