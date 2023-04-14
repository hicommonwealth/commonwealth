import 'components/sidebar/index.scss';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import React from 'react';
import { useLocation } from 'react-router-dom';

import app from 'state';
import { SubscriptionButton } from 'views/components/subscription_button';
import { useCommonNavigate } from '../../../navigation/helpers';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import { CWText } from '../component_kit/cw_text';
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

export const Sidebar = () => {
  const navigate = useCommonNavigate();
  const { pathname } = useLocation();
  const { isLoggedIn } = useUserLoggedIn();

  const onHomeRoute = pathname === `/${app.activeChainId()}/feed`;

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
              <ExternalLinksModule />
              <div className="buttons-container">
                {isLoggedIn && app.chain && (
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
