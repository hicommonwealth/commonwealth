/* @jsx m */

import m from 'mithril';
import { Icon, Icons, ListItem, PopoverMenu } from 'construct-ui';

import 'components/sidebar/community_selector.scss';

import app from 'state';
import { AddressInfo, ChainInfo, RoleInfo } from 'models';
import User from '../widgets/user';
import { CommunityLabel } from '../community_label';
import { CWIconButton } from '../component_kit/cw_icon_button';

const renderCommunity = (item) => {
  const roles: RoleInfo[] = [];
  if (item instanceof ChainInfo) {
    roles.push(...app.roles.getAllRolesInCommunity({ chain: item.id }));
  }

  return (
    <ListItem
      class={app.communities.isStarred(item.id) ? 'starred' : ''}
      label={<CommunityLabel community={item} />}
      selected={app.activeChainId() === item.id}
      onclick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        m.route.set(item.id ? `/${item.id}` : '/');
      }}
      contentRight={
        app.isLoggedIn() &&
        roles.length > 0 && (
          <div
            class="community-star-toggle"
            onclick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              await app.communities.setStarred(item.id);
              m.redraw();
            }}
          >
            {roles.map((role) => {
              // TODO: sometimes address_chain is null here -- why??
              return m(User, {
                avatarSize: 18,
                avatarOnly: true,
                user: new AddressInfo(
                  role.address_id,
                  role.address,
                  role.address_chain || role.chain_id,
                  null
                ),
              });
            })}
            <div class="star-icon">
              <Icon name={Icons.STAR} key={item.id} />
            </div>
          </div>
        )
      }
    />
  );
};

const homeButton = (
  <a
    class="home-button"
    href="/"
    onclick={() => {
      m.route.set('/');
    }}
  >
    <img
      class="mobile-logo"
      src="https://commonwealth.im/static/brand_assets/logo_stacked.png"
      style="height:18px; width:18px;"
    />
    <span>Home</span>
  </a>
);

export class CommunitySelector implements m.ClassComponent<{ isMobile: true }> {
  view(vnode) {
    const { isMobile } = vnode.attrs;
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

    const communityList = (
      <>
        {app.isLoggedIn() && (
          <>
            <h4>Your communities</h4>
            {starredCommunities.map(renderCommunity)}
            {joinedCommunities.map(renderCommunity)}
            {starredCommunities.length === 0 &&
              joinedCommunities.length === 0 && (
                <div class="community-placeholder">None</div>
              )}
            <h4>Other communities</h4>
          </>
        )}
        {unjoinedCommunities.map(renderCommunity)}
      </>
    );

    return isMobile ? (
      <div class="CommunitySelectList">{app.isLoggedIn() && communityList}</div>
    ) : (
      <div class="CommunitySelector">
        <div class="title-selector">
          <PopoverMenu
            transitionDuration={0}
            hasArrow={false}
            trigger={<CWIconButton iconName="gear" iconTheme="black" />}
            class="CommunitySelectList"
            content={communityList}
          />
        </div>
      </div>
    );
  }
}
