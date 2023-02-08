/* @jsx jsx */
import React from 'react';

import { ClassComponent, redraw, jsx } from 'mithrilInterop';

import 'components/sidebar/index.scss';
import { Action } from 'commonwealth/shared/permissions';

import 'components/sidebar/index.scss';
import { isActiveAddressPermitted } from 'controllers/server/roles';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { ChatSection } from '../chat/chat_section';
import { AdminSection } from './admin_section';
import { DiscussionSection } from './discussion_section';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import { ExternalLinksModule } from './external_links_module';
import { GovernanceSection } from './governance_section';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export class Sidebar extends ClassComponent {
  view() {
    const activeAddressRoles = app.roles.getAllRolesInCommunity({
      chain: app.activeChainId(),
    });

    app.sidebarRedraw.on('redraw', () => {
      this.redraw();
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

    return (
      <div className="Sidebar">
        {app.sidebarMenu === 'default' && (
          <div className="sidebar-default-menu">
            <SidebarQuickSwitcher />
            {app.chain && (
              <div className="community-menu">
                <AdminSection />
                <DiscussionSection />
                <GovernanceSection />
                {/* app.socket && !hideChat && <ChatSection /> */}
                <ExternalLinksModule />
                <div className="buttons-container">
                  {app.isLoggedIn() && app.chain && (
                    <div className="subscription-button">
                      <SubscriptionButton />
                    </div>
                  )}
                  {app.isCustomDomain() && (
                    <div
                      className="powered-by"
                      onClick={() => {
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
