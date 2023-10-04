import 'components/sidebar/index.scss';
import React, { useEffect, useMemo } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { CommunitySection } from './CommunitySection';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { SidebarHeader } from '../component_kit/CWSidebarHeader';
import clsx from 'clsx';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export const Sidebar = ({ isInsideCommunity }) => {
  const {
    menuName,
    menuVisible,
    setRecentlyUpdatedVisibility,
    recentlyUpdatedVisibility
  } = useSidebarStore();

  useEffect(() => {
    setRecentlyUpdatedVisibility(false);
  }, []);

  const sidebarClass = useMemo(() => {
    return clsx('Sidebar', {
      onadd: menuVisible && recentlyUpdatedVisibility,
      onremove: !menuVisible
    });
  }, [menuVisible, recentlyUpdatedVisibility]);

  return (
    <div className={sidebarClass}>
      {app.chain && (
        <div className="sidebar-header-wrapper">
          <SidebarHeader />
        </div>
      )}
      <div className="sidebar-default-menu">
        <SidebarQuickSwitcher />
        {isInsideCommunity && (
          <CommunitySection showSkeleton={!app.activeChainId()} />
        )}
        {menuName === 'createContent' && <CreateContentSidebar />}
        {menuName === 'exploreCommunities' && <ExploreCommunitiesSidebar />}
      </div>
    </div>
  );
};
