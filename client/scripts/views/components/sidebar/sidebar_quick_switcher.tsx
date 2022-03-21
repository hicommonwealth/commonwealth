/* @jsx m */

import m from 'mithril';
import { Button, Icon, Icons } from 'construct-ui';

import 'components/sidebar/sidebar_quick_switcher.scss';

import app from 'state';
import { link } from 'helpers';
import { ChainInfo } from 'models';
import { ChainIcon } from 'views/components/chain_icon';
import { CommunitySelector } from 'views/components/sidebar/community_selector';

type SidebarQuickSwitcherItemAttrs = {
  item: ChainInfo;
  size: number;
};

class SidebarQuickSwitcherItem
  implements m.ClassComponent<SidebarQuickSwitcherItemAttrs>
{
  view(vnode) {
    const { item, size } = vnode.attrs;

    return (
      <div class="SidebarQuickSwitcherItem" key={`chain-${item.id}`}>
        <ChainIcon
          size={size}
          chain={item}
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
      .filter((item) =>
        item instanceof ChainInfo
          ? app.config.nodes.getByChain(item.id)?.length > 0
          : true
      ); // only chains with nodes

    const starredCommunities = allCommunities.filter((item) => {
      // filter out non-starred communities
      if (
        item instanceof ChainInfo &&
        !app.communities.isStarred(item.id, null)
      )
        return false;
      return true;
    });

    const size = 32;

    return (
      <div class="SidebarQuickSwitcher">
        <div class="community-nav-bar">
          <Button
            rounded={true}
            label={<Icon name={Icons.HOME} />}
            onclick={(e) => {
              e.preventDefault();
              m.route.set('/');
            }}
          />
          <CommunitySelector />
          {app.isLoggedIn() && (
            <Button
              rounded={true}
              label={<Icon name={Icons.PLUS} />}
              onclick={(e) => {
                e.preventDefault();
                m.route.set('/createCommunity');
              }}
            />
          )}
        </div>
        <div class="scrollable-community-bar">
          {starredCommunities.map((item) => (
            <SidebarQuickSwitcherItem item={item} size={size} />
          ))}
        </div>
      </div>
    );
  }
}
