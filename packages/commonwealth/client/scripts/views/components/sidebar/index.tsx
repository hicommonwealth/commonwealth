import clsx from 'clsx';
import 'components/sidebar/index.scss';
import React, { useEffect, useMemo } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { SidebarHeader } from '../component_kit/CWSidebarHeader';
import { CommunitySection } from './CommunitySection';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
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
    <div className={sidebarClass}>
      {isInsideCommunity && (
        <div className="sidebar-header-wrapper">
          <SidebarHeader
            isInsideCommunity={isInsideCommunity}
            onMobile={onMobile}
          />
        </div>
      )}
      <div className="sidebar-default-menu">
        <SidebarQuickSwitcher
          isInsideCommunity={isInsideCommunity}
          onMobile={onMobile}
        />
        {isInsideCommunity && (
          <CommunitySection showSkeleton={!app.activeChainId()} />
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
