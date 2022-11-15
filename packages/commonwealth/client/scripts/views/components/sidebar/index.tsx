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
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { ExploreCommunitiesSidebar } from './explore_sidebar';

type SidebarAttrs = {
  onMobile: boolean;
};

export type SidebarMenuName =
  | 'default'
  | 'create-content'
  | 'explore-communities';

export class Sidebar implements m.ClassComponent<SidebarAttrs> {
  view(vnode: m.VnodeDOM<SidebarAttrs, this>) {
    const { onMobile } = vnode.attrs;
    if (!app.sidebarMenu) app.sidebarMenu = 'default';

    const showSidebar = app.sidebarToggled || !onMobile;
    const showDefaultSidebar = showSidebar && app.sidebarMenu === 'default';
    const showCommunityMenu = showDefaultSidebar && app.chain;
    const showCommunityHeader =
      showCommunityMenu && onMobile && app.sidebarToggled;
    const showCreateSidebar =
      showSidebar && app.sidebarMenu === 'create-content';
    const showExploreSidebar =
      showSidebar && app.sidebarMenu === 'explore-communities';

    return (
      <div class="Sidebar">
        {showCommunityHeader && <CommunityHeader meta={app.chain.meta} />}
        {showDefaultSidebar && (
          <div class="sidebar-default-menu">
            <SidebarQuickSwitcher />
            {showCommunityMenu && (
              <div class="community-menu">
                <AdminSection />
                <DiscussionSection />
                <GovernanceSection />
                {app.socket && !!app.chain?.meta?.chatEnabled && (
                  <ChatSection />
                )}
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
        )}
        {showCreateSidebar && <CreateContentSidebar />}
        {showExploreSidebar && <ExploreCommunitiesSidebar />}
      </div>
    );
  }
}
