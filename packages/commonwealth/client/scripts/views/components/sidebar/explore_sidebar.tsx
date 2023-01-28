/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/sidebar/explore_sidebar.scss';
import { ChainInfo } from 'models';

import app from 'state';
import { CWSidebarMenu } from '../component_kit/cw_sidebar_menu';
import type { MenuItem } from '../component_kit/types';

export class ExploreCommunitiesSidebar extends ClassComponent {
  view() {
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

    const unjoinedCommunities = allCommunities.filter((c) => !isInCommunity(c));

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
            ...(starredCommunities.length === 0 &&
            joinedCommunities.length === 0
              ? [{ type: 'default', label: 'None' } as MenuItem]
              : []),
            { type: 'header', label: 'Other communities' } as MenuItem,
          ]
        : []),
      ...(unjoinedCommunities.map((c: ChainInfo) => {
        return {
          community: c,
          type: 'community',
        };
      }) as MenuItem[]),
    ];

    return (
      <CWSidebarMenu
        className="ExploreCommunitiesSidebar"
        menuHeader={{
          label: 'Explore',
          onClick: async () => {
            const sidebar = document.getElementsByClassName(
              'ExploreCommunitiesSidebar'
            );
            sidebar[0].classList.add('onremove');
            setTimeout(() => {
              app.sidebarToggled = false;
              app.sidebarMenu = 'default';
              redraw();
            }, 200);
          },
        }}
        menuItems={communityList}
      />
    );
  }
}
