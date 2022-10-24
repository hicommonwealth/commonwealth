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
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { CommunityHeader } from './community_header';
import { getClasses } from '../component_kit/helpers';

type SidebarAttrs = {
  isSidebarToggleable?: boolean;
  isSidebarToggled?: boolean;
};

export class Sidebar implements m.ClassComponent<SidebarAttrs> {
  view(vnode: m.VnodeDOM<SidebarAttrs, this>) {
    const { isSidebarToggleable, isSidebarToggled } = vnode.attrs;

    const hideChat = !app.chain?.meta?.chatEnabled;

    const showQuickSwitcher = isSidebarToggleable ? isSidebarToggled : true;

    return (
      <div class="Sidebar">
        {app.chain && isSidebarToggleable && isSidebarToggled && (
          <CommunityHeader meta={app.chain.meta} />
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
