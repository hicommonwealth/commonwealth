import React from 'react';
import { CWSidebarMenu } from '../component_kit/cw_sidebar_menu';
import { useCommonNavigate } from 'navigation/helpers';
import { SidebarSectionGroup } from './sidebar_section';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';
import app from 'state';
import ChainInfo from '../../../models/ChainInfo';
import {
  SubSectionAttrs,
  SectionGroupAttrs,
  SidebarSectionAttrs,
  ToggleTree,
} from './types';
import { sidebarStore } from 'state/ui/sidebar';

type MenuItem = {
  type: 'community';
  community: ChainInfo;
};

type SubSectionAttrsWithCommunity = SubSectionAttrs & {
  community: ChainInfo;
};

export const ExploreSection = () => {
  const navigate = useCommonNavigate();

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
    return c instanceof ChainInfo && app.communities.isStarred(c.id);
  });

  const joinedCommunities = allCommunities.filter(
    (c) => isInCommunity(c) && !app.communities.isStarred(c.id)
  );

  const communitySections = [
    ...(app.isLoggedIn()
      ? [
          ...(starredCommunities.map((c: ChainInfo) => {
            return {
              title: c.name,
              containsChildren: true,
              displayData: [
                {
                  rowIcon: true,
                  icon: <CWIcon name="community" iconName="badge" />,
                  title: 'Go to community',
                },
              ],
              hasDefaultToggle: false,
              isActive: false,
              isVisible: true,
              isUpdated: false,
              onClick: (e, toggle) => {
                e.preventDefault();
                navigate(`/${c.id}`);
              },
            };
          }) as SectionGroupAttrs[]),
          ...(joinedCommunities.map((c: ChainInfo) => {
            return {
              title: c.name,
              containsChildren: true,
              displayData: [
                {
                  rowIcon: true,
                  icon: <CWIcon name="community" iconName="badge" />,
                  title: 'Go to community',
                },
              ],
              hasDefaultToggle: false,
              isActive: false,
              isVisible: true,
              isUpdated: false,
              onClick: (e, toggle) => {
                e.preventDefault();
                navigate(`/${c.id}`);
              },
            };
          }) as SectionGroupAttrs[]),
          {
            title: '    New +',
            containsChildren: false,
            displayData: [
              {
                rowIcon: true,
                icon: <CWIcon name="create" iconName="plus" />,
                title: '+',
              },
            ],
            hasDefaultToggle: false,
            isActive: false,
            isVisible: true,
            isUpdated: false,
            onClick: (e, toggle) => {
              e?.preventDefault();
              sidebarStore
                .getState()
                .setMenu({ name: 'default', isVisible: true });
              navigate('/createCommunity', {}, null);
            },
          },
        ]
      : []),
  ];

  const exploreCommunitiesDefaultToggleTree: ToggleTree = {
    toggledState: false,
    children: {},
  };

  const toggleTreeState = JSON.parse(
    localStorage[`${app.activeChainId()}-explore-communities-toggle-tree`] ||
      '{}'
  );

  const sidebarSectionData: SidebarSectionAttrs = {
    title: 'Explore',
    className: 'ExploreCommunitiesSection',
    hasDefaultToggle: toggleTreeState['toggledState'],
    onClick: (e, toggle) => {
      e.preventDefault();
      localStorage[`${app.activeChainId()}-explore-communities-toggle-tree`] =
        JSON.stringify({
          toggledState: toggle,
          children: toggleTreeState.children,
        });
    },
    displayData: communitySections,
    isActive: false,
    toggleDisabled: false,
  };

  return <SidebarSectionGroup {...sidebarSectionData} />;
};
