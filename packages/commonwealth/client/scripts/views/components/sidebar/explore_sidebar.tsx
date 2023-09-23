import React from 'react';

import 'components/sidebar/explore_sidebar.scss';
import ChainInfo from '../../../models/ChainInfo';

import app from 'state';
import { CWSidebarMenu } from '../component_kit/cw_sidebar_menu';
import type { MenuItem } from '../component_kit/types';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import { isWindowSmallInclusive } from '../component_kit/helpers';

export const ExploreCommunitiesSidebar = () => {
  const { setMenu } = useSidebarStore();

  const allCommunities = app.config.chains
    .getAll()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((item) => {
      // only show chains with nodes
      return !!item.node;
    });

  const isInCommunity = (item) => {
    if (item instanceof ChainInfo) {
      return app.roles.getAllRolesInCommunity({ chain: item.id }).length > 0;
    } else {
      return false;
    }
  };

  const starredCommunities = allCommunities.filter((c) => {
    return c instanceof ChainInfo && app.user.isCommunityStarred(c.id);
  });

  const joinedCommunities = allCommunities.filter(
    (c) => isInCommunity(c) && !app.user.isCommunityStarred(c.id)
  );

  const communityList: MenuItem[] = [
    ...(app.isLoggedIn()
      ? [
          { type: 'header', label: 'Your communities' } as MenuItem,
          ...(starredCommunities.map((c: ChainInfo) => {
            return {
              community: c,
              type: 'community',
            };
          }) as MenuItem[]),
          ...(joinedCommunities.map((c: ChainInfo) => {
            return {
              community: c,
              type: 'community',
            };
          }) as MenuItem[]),
          ...(starredCommunities.length === 0 && joinedCommunities.length === 0
            ? [{ type: 'default', label: 'None' } as MenuItem]
            : []),
        ]
      : []),
  ];

  return (
    <CWSidebarMenu
      className="ExploreCommunitiesSidebar"
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
