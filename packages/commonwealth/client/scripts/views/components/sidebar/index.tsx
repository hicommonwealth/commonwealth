import React, { useEffect } from 'react';
import { _DEPRECATED_getRoute } from 'mithrilInterop';

import 'components/sidebar/index.scss';

import app from 'state';
import { Action } from 'permissions';
import { isActiveAddressPermitted } from 'controllers/server/roles';
import { SubscriptionButton } from 'views/components/subscription_button';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { AdminSection } from './admin_section';
import { DiscussionSection } from './discussion_section';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import { ExternalLinksModule } from './external_links_module';
import { GovernanceSection } from './governance_section';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
import { useCommonNavigate } from '../../../navigation/helpers';
import useForceRerender from 'hooks/useForceRerender';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export const Sidebar = () => {
  const navigate = useCommonNavigate();
  const forceRerender = useForceRerender();

  const activeAddressRoles = app.roles.getAllRolesInCommunity({
    chain: app.activeChainId(),
  });

  useEffect(() => {
    app.sidebarRedraw.on('redraw', () => forceRerender());

    return () => {
      app.sidebarRedraw.on('redraw', () => forceRerender());
    };
  });

  const currentChainInfo = app.chain?.meta;

  const onHomeRoute = _DEPRECATED_getRoute() === `/${app.activeChainId()}/feed`;

  const hideChat =
    !currentChainInfo ||
    !activeAddressRoles ||
    !isActiveAddressPermitted(
      activeAddressRoles,
      currentChainInfo,
      Action.VIEW_CHAT_CHANNELS
    );

  const isAdmin =
    app.user.isSiteAdmin ||
    app.roles.isAdminOfEntity({
      chain: app.activeChainId(),
    });

  const isMod = app.roles.isRoleOfCommunity({
    role: 'moderator',
    chain: app.activeChainId(),
  });

  const showAdmin = app.user && (isAdmin || isMod);

  return (
    <div className="Sidebar">
      {app.sidebarMenu === 'default' && (
        <div className="sidebar-default-menu">
          <SidebarQuickSwitcher />
          {app.chain && (
            <div className="community-menu">
              {showAdmin && <AdminSection />}
              {app.chain.meta.hasHomepage && (
                <div
                  className={onHomeRoute ? 'home-button active' : 'home-button'}
                  onClick={() => navigate('/feed')}
                >
                  <CWIcon iconName="home" iconSize="small" />
                  <CWText>Home</CWText>
                </div>
              )}
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
};
