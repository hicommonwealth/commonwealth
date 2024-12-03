import React from 'react';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import useUserStore from 'state/ui/user';
import { CWSidebarMenu } from '../component_kit/cw_sidebar_menu';
import { getClasses } from '../component_kit/helpers';
import type { MenuItem } from '../component_kit/types';
import './explore_sidebar.scss';

export const ExploreCommunitiesSidebar = ({
  isInsideCommunity,
}: {
  isInsideCommunity: boolean;
}) => {
  const { setMenu } = useSidebarStore();

  const user = useUserStore();

  const communityList: MenuItem[] = [
    ...(user.isLoggedIn
      ? [
          { type: 'header', label: 'Your communities' } as MenuItem,
          ...(user.communities.map((c) => {
            return {
              community: {
                id: c.id,
                iconUrl: c.iconUrl,
                name: c.name,
                isStarred: c.isStarred,
              },
              type: 'community',
            };
          }) as MenuItem[]),
          ...(user.communities.length === 0
            ? [{ type: 'default', label: 'None' } as MenuItem]
            : []),
        ]
      : []),
  ];

  return (
    <CWSidebarMenu
      className={getClasses<{
        heightInsideCommunity: boolean;
      }>(
        {
          heightInsideCommunity: isInsideCommunity,
        },
        'ExploreCommunitiesSidebar',
      )}
      menuHeader={{
        label: 'Explore',
        onClick: async () => {
          setTimeout(() => {
            const isSidebarOpen =
              !!sidebarStore.getState().userToggledVisibility;
            setMenu({ name: 'default', isVisible: isSidebarOpen });
          }, 200);
        },
      }}
      menuItems={communityList}
    />
  );
};
