/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, redraw } from 'mithrilInterop';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelPageViewEvent } from 'analytics/types';
import 'components/sidebar/sidebar_quick_switcher.scss';

import app from 'state';
import { link } from 'helpers';
import { ChainInfo } from 'models';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { CWDivider } from '../component_kit/cw_divider';

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
      if (item instanceof ChainInfo && !app.communities.isStarred(item.id))
        return false;
      return true;
    });

    return (
      <div class="SidebarQuickSwitcher">
        <div class="community-nav-bar">
          {app.isLoggedIn() && (
            <CWIconButton
              iconName="plusCircle"
              iconButtonTheme="black"
              onclick={(e) => {
                e.preventDefault();
                mixpanelBrowserTrack({
                  event: MixpanelPageViewEvent.COMMUNITY_CREATION_PAGE_VIEW,
                  isCustomDomain: app.isCustomDomain(),
                });
                app.sidebarMenu = 'createContent';
              }}
            />
          )}
          <CWIconButton
            iconName="compass"
            iconButtonTheme="black"
            onclick={(e) => {
              e.preventDefault();
              app.sidebarMenu = 'exploreCommunities';
            }}
          />
        </div>
        <CWDivider />
        <div class="scrollable-community-bar">
          {starredCommunities.map((item) => (
            <CWCommunityAvatar
              size="large"
              community={item}
              onclick={link ? () => setRoute(`/${item.id}`) : undefined}
            />
          ))}
        </div>
      </div>
    );
  }
}
