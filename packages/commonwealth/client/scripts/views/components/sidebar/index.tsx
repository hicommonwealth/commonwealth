/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ExternalLinksModule } from './external_links_module';
import { ChatSection } from '../chat/chat_section';
import { AdminSection } from './admin_section';
import { getClasses } from '../component_kit/helpers';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { CommunityHeader } from './community_header';

type SidebarAttrs = {
  isSidebarToggled?: boolean;
};

export class Sidebar implements m.ClassComponent<SidebarAttrs> {
  view(vnode: m.VnodeDOM<SidebarAttrs, this>) {
    // const { isSidebarToggled } = vnode.attrs;

    const hideChat = !app.chain?.meta?.chatEnabled;

    return (
      <div class="Sidebar">
        {app.chain && <CommunityHeader meta={app.chain.meta} />}
        <div class="quickswitcher-and-sidebar-inner">
          <SidebarQuickSwitcher />
          {app.chain && (
            <div class="sidebar-inner">
              <AdminSection />
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
          )}
        </div>
      </div>
    );
  }
}
