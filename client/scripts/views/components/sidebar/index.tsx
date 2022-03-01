/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ChatSection } from '../chat/chat_section';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { ChainStatusModule } from './chain_status_module';
import { ExternalLinksModule } from './external_links_module';

type SidebarAttrs = { useQuickSwitcher?: boolean };

export class Sidebar implements m.ClassComponent<SidebarAttrs> {
  view(vnode) {
    const { useQuickSwitcher } = vnode.attrs;
    const isCustom = app.isCustomDomain();

    return (
      <div>
        {!isCustom && <SidebarQuickSwitcher />}
        {!useQuickSwitcher && app.chain && (
          <div class={`Sidebar ${isCustom ? 'custom-domain' : ''}`}>
            <DiscussionSection />
            <GovernanceSection />
            {app.socket && (
              <ChatSection
                channels={Object.values(app.socket.chatNs.channels)}
                activeChannel={m.route.param()['channel']}
              />
            )}
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
        )}
      </div>
    );
  }
}
