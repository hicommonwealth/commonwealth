import 'components/sidebar/index.scss';
import { featureFlags } from 'helpers/feature-flags';
import React, { useEffect, useMemo, useState } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { CommunitySection } from './CommunitySection';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export const Sidebar = ({ isInsideCommunity }) => {
  const {
    menuName,
    menuVisible,
    setRecentlyUpdatedVisibility,
    recentlyUpdatedVisibility,
  } = useSidebarStore();

  useEffect(() => {
    setRecentlyUpdatedVisibility(false);
  }, []);

  const sidebarClass = useMemo(() => {
    return `Sidebar ${
      menuVisible ? (recentlyUpdatedVisibility ? 'onadd' : '') : 'onremove'
    }`;
  }, [menuVisible, recentlyUpdatedVisibility]);

  return (
    <div className={sidebarClass}>
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
