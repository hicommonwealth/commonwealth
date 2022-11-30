/* @jsx m */

import m from 'mithril';

import 'components/sidebar/index.scss';

import { Action } from 'common-common/src/permissions';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { isActiveAddressPermitted } from 'controllers/server/roles';
import { DiscussionSection } from './discussion_section';
import { GovernanceSection } from './governance_section';
import { ExternalLinksModule } from './external_links_module';
import { ChatSection } from '../chat/chat_section';
import { AdminSection } from './admin_section';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
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
  view(vnode: m.Vnode<SidebarAttrs>) {
    const { onMobile } = vnode.attrs;
    if (!app.sidebarMenu) app.sidebarMenu = 'default';

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

    const showSidebar = app.sidebarToggled || !onMobile;
    const showDefaultSidebar = showSidebar;
    const showCommunityMenu = showDefaultSidebar && app.chain;
    const showCreateSidebar =
      showSidebar && app.sidebarMenu === 'create-content';
    const showExploreSidebar =
      showSidebar && app.sidebarMenu === 'explore-communities';

    return (
      <div class="Sidebar">
        {showDefaultSidebar && (
          <div class="sidebar-default-menu">
            <SidebarQuickSwitcher />
            {showCommunityMenu && (
              <div class="community-menu">
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
        )}
        {showCreateSidebar && <CreateContentSidebar />}
        {showExploreSidebar && <ExploreCommunitiesSidebar />}
      </div>
    );
  }
}
