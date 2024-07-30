import 'components/sidebar/explore_sidebar.scss';
import React from 'react';
import app from 'state';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import useUserStore from 'state/ui/user';
import Permissions from 'utils/Permissions';
import ChainInfo from '../../../models/ChainInfo';
import { CWSidebarMenu } from '../component_kit/cw_sidebar_menu';
import { getClasses } from '../component_kit/helpers';
import type { MenuItem } from '../component_kit/types';

export const ExploreCommunitiesSidebar = ({
  isInsideCommunity,
}: {
  isInsideCommunity: boolean;
}) => {
  const { setMenu } = useSidebarStore();

  const user = useUserStore();

  const allCommunities = app.config.chains
    .getAll()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((item) => {
      // only show chains with nodes
      return !!item.node;
    });

  const isInCommunity = (item) => {
    if (item instanceof ChainInfo) {
      return Permissions.isCommunityMember(item.id);
    } else {
      return false;
    }
  };

  const starredCommunities = allCommunities.filter((c) => {
    return (
      c instanceof ChainInfo &&
      user.starredCommunities.find(
        (starCommunity) => starCommunity.community_id === c.id,
      )
    );
  });

  const joinedCommunities = [...allCommunities]
    .filter(isInCommunity)
    .sort((a, b) => a.name.localeCompare(b.name));

  const communityList: MenuItem[] = [
    ...(app.isLoggedIn()
      ? [
          { type: 'header', label: 'Your communities' } as MenuItem,
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
