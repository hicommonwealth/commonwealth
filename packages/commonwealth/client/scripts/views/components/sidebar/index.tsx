import 'components/sidebar/index.scss';
import React from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { CommunitySection } from './CommunitySection';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';
import { SidebarHeader } from '../component_kit/CWSidebarHeader';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export const Sidebar = ({ isInsideCommunity }) => {
  const { menuName } = useSidebarStore();

  return (
    <div className="Sidebar">
      <div style={{ backgroundColor: '#F7F7F7' }}>
        <SidebarHeader />
      </div>
      <div className="sidebar-default-menu">
        <SidebarQuickSwitcher />
        {isInsideCommunity && (
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <CommunitySection showSkeleton={!app.activeChainId()} />
          </div>
        )}
        {menuName === 'createContent' && <CreateContentSidebar />}
        {menuName === 'exploreCommunities' && <ExploreCommunitiesSidebar />}
      </div>
    </div>
  );
};
