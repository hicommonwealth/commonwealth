/* @jsx m */

import m from 'mithril';
import { Button, Icon, Icons, ListItem, PopoverMenu } from 'construct-ui';

import 'components/sidebar/community_selector.scss';

import app from 'state';
import { AddressInfo, ChainInfo, RoleInfo } from 'models';
import User from '../widgets/user';
import { CommunityLabel } from '../community_label';

type CommunitySelectorAttrs = {
  showTextLabel?: boolean;
  showListOnly?: boolean;
  showHomeButtonAtTop?: boolean;
};

export class CommunitySelector
  implements m.ClassComponent<CommunitySelectorAttrs>
{
  view(vnode) {
    const { showTextLabel, showListOnly, showHomeButtonAtTop } = vnode.attrs;
    const activeEntityName = app.chain?.meta.chain.name;
    const allCommunities = app.config.chains
      .getAll()
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a) => {
        // sort starred communities at top
        if (a instanceof ChainInfo && app.communities.isStarred(a.id, null))
          return -1;
        return 0;
      })
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
    const joinedCommunities = allCommunities.filter((c) => isInCommunity(c));
    const unjoinedCommunities = allCommunities.filter((c) => !isInCommunity(c));

    const renderCommunity = (item) => {
      const roles: RoleInfo[] = [];
      if (item instanceof ChainInfo) {
        roles.push(...app.user.getAllRolesInCommunity({ chain: item.id }));
      }

      return item instanceof ChainInfo ? (
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
            <span>Home</span>,
          </a>
        )}
        {app.isLoggedIn() && (
          <div>
            <h4>Your communities</h4>
            {joinedCommunities.map(renderCommunity)}
            {joinedCommunities.length === 0 && (
              <div class="community-placeholder">None</div>
            )}
            <h4>Other communities</h4>
          </div>
        )}
        {unjoinedCommunities.map(renderCommunity)}
        {!showHomeButtonAtTop && renderCommunity('home')}
      </div>
    ) : (
      <div class="CommunitySelector">
        <div class="title-selector">
          <PopoverMenu
            transitionDuration={0}
            hasArrow={false}
            trigger={
              <Button
                rounded={true}
                label={
                  showTextLabel ? activeEntityName : <Icon name={Icons.MENU} />
                }
              />
            }
            inline={true}
            class="CommunitySelectList"
            content={
              <div>
                app.isLoggedIn() &&
                <div>
                  <h4>Your communities</h4>
                  {joinedCommunities.map(renderCommunity)}
                  {joinedCommunities.length === 0 && (
                    <div class="community-placeholder">None</div>
                  )}
                  <h4>Other communities</h4>
                </div>
                {unjoinedCommunities.map(renderCommunity)}
                {renderCommunity('home')}
              </div>
            }
          />
        </div>
      </div>
    );
  }
}
