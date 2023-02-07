/* @jsx jsx */
import React from 'react';

import { MixpanelPageViewEvent } from 'analytics/types';
import { ClassComponent, setRoute, jsx } from 'mithrilInterop';
import 'components/sidebar/sidebar_quick_switcher.scss';
import { link } from 'helpers';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { ChainInfo } from 'models';

import app from 'state';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWDivider } from '../component_kit/cw_divider';
import { CWIconButton } from '../component_kit/cw_icon_button';

export class SidebarQuickSwitcher extends ClassComponent {
  view() {
    const allCommunities = app.config.chains
      .getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(
        (item) => !!item.node // only chains with nodes
      );

    const starredCommunities = allCommunities.filter((item) => {
      // filter out non-starred communities
      return !(
        item instanceof ChainInfo && !app.communities.isStarred(item.id)
      );
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
                console.log(app.sidebarMenu)
              }}
            />
          )}
          <CWIconButton
            iconName="compass"
            iconButtonTheme="black"
            onClick={(e) => {
              e.preventDefault();
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
              onClick={link ? () => setRoute(`/${item.id}`) : undefined}
            />
          ))}
        </div>
      </div>
    );
  }
}
