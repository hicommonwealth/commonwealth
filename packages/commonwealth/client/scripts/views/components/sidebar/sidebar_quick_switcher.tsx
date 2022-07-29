/* @jsx m */

import m from 'mithril';
import { Button } from 'construct-ui';

import 'components/sidebar/sidebar_quick_switcher.scss';

import app from 'state';
import { link } from 'helpers';
import { ChainInfo } from 'models';
import { CommunitySelector } from 'views/components/sidebar/community_selector';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWIcon } from '../component_kit/cw_icons/cw_icon';

class SidebarQuickSwitcherItem
  implements m.ClassComponent<{ item: ChainInfo }>
{
  view(vnode) {
    const { item } = vnode.attrs;

    return (
      <div class="SidebarQuickSwitcherItem" key={`chain-${item.id}`}>
        <CWCommunityAvatar
          size="large"
          community={item}
          onclick={link ? () => m.route.set(`/${item.id}`) : null}
        />
      </div>
    );
  }
}

export class SidebarQuickSwitcher implements m.ClassComponent {
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
          <Button
            rounded={true}
            label={<CWIcon iconName="home" iconSize="small" />}
            onclick={(e) => {
              e.preventDefault();
              m.route.set(app.isLoggedIn() ? '/dashboard/for-you' : '/');
            }}
          />
          <CommunitySelector />
          {app.isLoggedIn() && (
            <Button
              rounded={true}
              label={<CWIcon iconName="plus" iconSize="small" />}
              onclick={(e) => {
                e.preventDefault();
                mixpanelBrowserTrack({
                  event: MixpanelCommunityCreationEvent.CREATE_BUTTON_PRESSED,
                  chainBase: null,
                  isCustomDomain: app.isCustomDomain(),
                  communityType: null,
                });
                m.route.set('/createCommunity');
              }}
            />
          )}
        </div>
        <div class="scrollable-community-bar">
          {starredCommunities.map((item) => (
            <SidebarQuickSwitcherItem item={item} />
          ))}
        </div>
      </div>
    );
  }
}
