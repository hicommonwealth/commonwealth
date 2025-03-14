import useUserStore from 'client/scripts/state/ui/user';
import clsx from 'clsx';
import React, { useEffect, useMemo } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { CreateContentSidebar } from '../../menus/CreateContentMenu';
import { KnockFeedWrapper } from '../KnockNotifications/KnockFeedWrapper';
import { SidebarHeader } from '../component_kit/CWSidebarHeader';
import { CommunitySection } from './CommunitySection';

import useSidebarSwipe from 'client/scripts/hooks/useSidebarSwipe';
import { SidebarProfileSection } from './SidebarProfileSection';
import SidebarSignInButton from './SidebarSignInButton/SidebarSignInButton';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import './index.scss';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export const Sidebar = ({
  isInsideCommunity,
  onMobile,
}: {
  isInsideCommunity: boolean;
  onMobile: boolean;
}) => {
  const {
    menuName,
    menuVisible,
    setRecentlyUpdatedVisibility,
    recentlyUpdatedVisibility,
  } = useSidebarStore();

  const user = useUserStore();
  const left = useSidebarSwipe();

  useEffect(() => {
    setRecentlyUpdatedVisibility(false);
  }, [setRecentlyUpdatedVisibility]);

  const sidebarClass = useMemo(() => {
    return clsx('Sidebar', {
      onMobile,
      onadd: menuVisible && recentlyUpdatedVisibility,
      onremove: !menuVisible,
    });
  }, [menuVisible, onMobile, recentlyUpdatedVisibility]);

  return (
    <div className={sidebarClass} style={{ left }}>
      {isInsideCommunity ? (
        <div className="sidebar-header-wrapper">
          <SidebarHeader
            isInsideCommunity={isInsideCommunity}
            onMobile={onMobile}
          />
        </div>
      ) : (
        <div className="sidebar-header-wrapper">
          <SidebarHeader
            isInsideCommunity={isInsideCommunity}
            onMobile={onMobile}
          />
        </div>
      )}
      <div className="sidebar-default-menu">
        <KnockFeedWrapper>
          <SidebarQuickSwitcher
            isInsideCommunity={isInsideCommunity}
            onMobile={onMobile}
          />
        </KnockFeedWrapper>
        {isInsideCommunity ? (
          <CommunitySection
            showSkeleton={!app.activeChainId()}
            isInsideCommunity={isInsideCommunity}
          />
        ) : (
          user.isLoggedIn && (
            <SidebarProfileSection
              showSkeleton={false}
              isInsideCommunity={isInsideCommunity}
            />
          )
        )}

        {!user.isLoggedIn && !isInsideCommunity && (
          <SidebarSignInButton isInsideCommunity={isInsideCommunity} />
        )}
        {menuName === 'createContent' && (
          <CreateContentSidebar isInsideCommunity={isInsideCommunity} />
        )}
        {menuName === 'exploreCommunities' && (
          <ExploreCommunitiesSidebar isInsideCommunity={isInsideCommunity} />
        )}
      </div>
    </div>
  );
};
