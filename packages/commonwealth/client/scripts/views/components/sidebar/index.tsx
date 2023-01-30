/* @jsx m */

import ClassComponent from 'class_component';

import 'components/sidebar/index.scss';
import { Action } from 'commonwealth/shared/permissions';

import 'components/sidebar/index.scss';
import { isActiveAddressPermitted } from 'controllers/server/roles';
import m from 'mithril';

import app from 'state';
import { navigateToSubpage } from 'router';
import { SubscriptionButton } from 'views/components/subscription_button';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { ChatSection } from '../chat/chat_section';
import { AdminSection } from './admin_section';
import { DiscussionSection } from './discussion_section';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import { ExternalLinksModule } from './external_links_module';
import { GovernanceSection } from './governance_section';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export class Sidebar extends ClassComponent {
  view() {
    const activeAddressRoles = app.roles.getAllRolesInCommunity({
      chain: app.activeChainId(),
    });

    const currentChainInfo = app.chain?.meta;

    const onHomeRoute = m.route.get() === `/${app.activeChainId()}/feed`;

    const hideChat =
      !currentChainInfo ||
      !activeAddressRoles ||
      !isActiveAddressPermitted(
        activeAddressRoles,
        currentChainInfo,
        Action.VIEW_CHAT_CHANNELS
      );

    return (
      <div class="Sidebar">
        {app.sidebarMenu === 'default' && (
          <div class="sidebar-default-menu">
            <SidebarQuickSwitcher />
            {app.chain && (
              <div class="community-menu">
                <AdminSection />
                <div
                  class={onHomeRoute ? 'home-button active' : 'home-button'}
                  onclick={() => navigateToSubpage('/feed')}
                >
                  <CWIcon iconName="home" iconSize="small" />
                  <CWText>Home</CWText>
                </div>
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
        {app.sidebarMenu === 'createContent' && <CreateContentSidebar />}
        {app.sidebarMenu === 'exploreCommunities' && (
          <ExploreCommunitiesSidebar />
        )}
      </div>
    );
  }
}
