import clsx from 'clsx';
import 'components/sidebar/index.scss';
import React, { useEffect, useMemo } from 'react';
import app from 'state';
import useSidebarStore from 'state/ui/sidebar';
import { featureFlags } from '../../../helpers/feature-flags';
import { CreateContentSidebar } from '../../menus/create_content_menu';
import { SidebarHeader } from '../component_kit/CWSidebarHeader';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CommunitySection } from './CommunitySection';
import { ExploreCommunitiesSidebar } from './explore_sidebar';
import { SidebarQuickSwitcher } from './sidebar_quick_switcher';

export type SidebarMenuName =
  | 'default'
  | 'createContent'
  | 'exploreCommunities';

export const Sidebar = ({
  isInsideCommunity,
}: {
  isInsideCommunity: boolean;
}) => {
  const {
    setMenu,
    menuName,
    menuVisible,
    setRecentlyUpdatedVisibility,
    recentlyUpdatedVisibility,
    setUserToggledVisibility,
  } = useSidebarStore();

  function handleToggle() {
    const isVisible = !menuVisible;
    setMenu({ name: menuName, isVisible });
    setTimeout(() => {
      setUserToggledVisibility(isVisible ? 'open' : 'closed');
    }, 200);
  }

  useEffect(() => {
    setRecentlyUpdatedVisibility(false);
  }, [setRecentlyUpdatedVisibility]);

  const sidebarClass = useMemo(() => {
    return clsx('Sidebar', {
      onadd: menuVisible && recentlyUpdatedVisibility,
      onremove: !menuVisible,
    });
  }, [menuVisible, recentlyUpdatedVisibility]);

  if (!menuVisible && featureFlags.sidebarToggle) {
    return (
      <div className="expand-sidebar">
        <CWIconButton
          iconButtonTheme="black"
          iconName="caretDoubleRight"
          onClick={handleToggle}
        />
      </div>
    );
  }

  return (
    <div className={sidebarClass}>
      {isInsideCommunity && (
        <div className="sidebar-header-wrapper">
          <SidebarHeader handleToggle={handleToggle} />
        </div>
      )}
      <div className="sidebar-default-menu">
        <SidebarQuickSwitcher />
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
