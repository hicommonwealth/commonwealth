import React from 'react';

import 'components/sidebar/sidebar_quick_switcher.scss';

import { navigateToSubpage } from 'router';
import { MixpanelPageViewEvent } from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { link } from 'helpers';
import { ChainInfo } from 'models';

import app from 'state';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWDivider } from '../component_kit/cw_divider';
import { CWIconButton } from '../component_kit/cw_icon_button';
import withRouter from 'navigation/helpers';

const SidebarQuickSwitcherComponent = () => {
  const allCommunities = app.config.chains
    .getAll()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(
      (item) => !!item.node // only chains with nodes
    );

  const starredCommunities = allCommunities.filter((item) => {
    // filter out non-starred communities
    return !(item instanceof ChainInfo && !app.communities.isStarred(item.id));
  });

  return (
    <div className="SidebarQuickSwitcher">
      <div className="community-nav-bar">
        {app.isLoggedIn() && (
          <CWIconButton
            iconName="plusCircle"
            iconButtonTheme="black"
            onClick={(e) => {
              e.preventDefault();
              app.sidebarMenu = 'createContent';
              app.sidebarRedraw.emit('redraw');
            }}
          />
        )}
        <CWIconButton
          iconName="compass"
          iconButtonTheme="black"
          onClick={(e) => {
            e.preventDefault();
            app.sidebarRedraw.emit('redraw');
            app.sidebarMenu = 'exploreCommunities';
          }}
        />
      </div>
      <CWDivider />
      <div className="scrollable-community-bar">
        {starredCommunities.map((item) => (
          <CWCommunityAvatar
            key={item.id}
            size="large"
            community={item}
            onClick={link ? () => navigateToSubpage(`/${item.id}`) : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export const SidebarQuickSwitcher = withRouter(SidebarQuickSwitcherComponent);
