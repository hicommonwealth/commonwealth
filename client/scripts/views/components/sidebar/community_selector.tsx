/* @jsx m */

import m from 'mithril';
import { Button, Icon, Icons, ListItem, PopoverMenu } from 'construct-ui';

import 'components/sidebar/community_selector.scss';

import app from 'state';
import { AddressInfo, ChainInfo, RoleInfo } from 'models';
import User from '../widgets/user';
import { CommunityLabel } from '../community_label';

const renderCommunity = (item) => {
  const roles: RoleInfo[] = [];
  if (item instanceof ChainInfo) {
    roles.push(...app.user.getAllRolesInCommunity({ chain: item.id }));
  }

  return (
    <ListItem
      class={app.communities.isStarred(item.id, null) ? 'starred' : ''}
      label={<CommunityLabel chain={item} />}
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
              await app.communities.setStarred(
                item.id,
                null,
                !app.communities.isStarred(item.id, null)
              );
              m.redraw();
            }}
          >
            {roles.map((role) => {
              return m(User, {
                avatarSize: 18,
                avatarOnly: true,
                user: new AddressInfo(
                  null,
                  role.address,
                  role.address_chain,
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
      src="https://commonwealth.im/static/img/logo.png"
      style="height:18px; width:18px;"
    />
    <span>Home</span>
  </a>
);

export class CommunitySelector implements m.ClassComponent<{ isMobile: true }> {
  view(vnode) {
    const { isMobile } = vnode.attrs;
    const activeEntityName = app.chain?.meta.chain.name;
    const allCommunities = app.config.chains
      .getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((item) => {
        // only show chains with nodes
        return item instanceof ChainInfo
          ? app.config.nodes.getByChain(item.id)?.length
          : true;
      });

    const isInCommunity = (item) => {
      if (item instanceof ChainInfo) {
        return app.user.getAllRolesInCommunity({ chain: item.id }).length > 0;
      } else {
        return false;
      }
    };
    const starredCommunities = allCommunities.filter((c) => {
      return c instanceof ChainInfo && app.communities.isStarred(c.id, null);
    });
    const joinedCommunities = allCommunities.filter(
      (c) => isInCommunity(c) && !app.communities.isStarred(c.id, null)
    );
    const unjoinedCommunities = allCommunities.filter((c) => !isInCommunity(c));

    const renderCommunity = (item) => {
      const roles: RoleInfo[] = [];
      if (item instanceof ChainInfo) {
        roles.push(...app.user.getAllRolesInCommunity({ chain: item.id }));
      }

      return item instanceof ChainInfo ? (
        <ListItem
          class={app.communities.isStarred(item.id) ? 'starred' : ''}
          label={<CommunityLabel chain={item} />}
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
                  return m(User, {
                    avatarSize: 18,
                    avatarOnly: true,
                    user: new AddressInfo(
                      null,
                      role.address,
                      role.address_chain,
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
      ) : m.route.get() !== '/' ? (
        <ListItem
          class="select-list-back-home"
          label="« Back home"
          onclick={() => {
            m.route.set(item.id ? `/${item.id}` : '/');
          }}
        />
      ) : null;
    };

    return showListOnly ? (
      <div class="CommunitySelectList">
        {showHomeButtonAtTop && (
          <a
            class="home-button"
            href="/"
            onclick={() => {
              m.route.set('/');
            }}
          >
            <img
              class="mobile-logo"
              src="https://commonwealth.im/static/img/logo.png"
              style="height:18px;width:18px;background:black;border-radius:50%;"
            />
            <span>Home</span>
          </a>
        )}
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
      <div class="CommunitySelectList">
        {homeButton}
        {app.isLoggedIn() && communityList}
      </div>
    ) : (
      <div class="CommunitySelector">
        <div class="title-selector">
          <PopoverMenu
            transitionDuration={0}
            hasArrow={false}
            trigger={
              <Button rounded={true} label={<Icon name={Icons.MENU} />} />
            }
            class="CommunitySelectList"
            content={communityList}
          />
        </div>
      </div>
    );
  }
}
