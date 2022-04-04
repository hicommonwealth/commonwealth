/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ChainStatusModule } from './chain_status_module';
import { ExternalLinksModule } from './external_links_module';

export class Sidebar implements m.ClassComponent {
  view() {
    const isCustom = app.isCustomDomain();

    return app.chain ? (
      <div class={`Sidebar${isCustom ? ' custom-domain' : ''}`}>
        <DiscussionSection />
        <GovernanceSection />
        <ExternalLinksModule />
        <div class="buttons-container">
          {app.isLoggedIn() && app.chain && (
            <div class="subscription-button">
              <SubscriptionButton />
            </div>
          )}
          {app.chain && <ChainStatusModule />}
          {app.isCustomDomain() && (
            <a
              class="PoweredBy"
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
