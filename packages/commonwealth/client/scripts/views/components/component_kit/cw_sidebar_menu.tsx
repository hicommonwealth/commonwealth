/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
import { ListItem, Icon, Icons } from 'construct-ui';

import 'components/component_kit/cw_sidebar_menu.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { AddressInfo, ChainInfo } from 'models';
import { getClasses } from './helpers';
import { CWText } from './cw_text';
import { CWIcon } from './cw_icons/cw_icon';
import { ComponentType, MenuItem } from './types';
import { CommunityLabel } from '../community_label';
import User from '../widgets/user';

// TODO: Switch to new component kit system, migrate to more native setup
const renderCommunity = (item: ChainInfo) => {
  const roles = app.roles.getAllRolesInCommunity({ chain: item.id });

  return (
    <div
      class={getClasses<{ isSelected: boolean }>(
        { isSelected: app.activeChainId() === item.id },
        'SidebarMenuItem community'
      )}
      onclick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        app.sidebarToggled = false;
        app.sidebarMenu = 'default';
        setRoute(item.id ? `/${item.id}` : '/');
      }}
    >
      <CommunityLabel community={item} />
      {app.isLoggedIn() && roles.length > 0 && (
        <div class="roles-and-star">
          {roles.map((role) => {
            return render(User, {
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
          <div
            class={
              app.communities.isStarred(item.id) ? 'star-filled' : 'star-empty'
            }
            onclick={async (e) => {
              e.stopPropagation();
              await app.communities.setStarred(item.id);
              redraw();
            }}
          />
        </div>
      )}
    </div>
  );
};

class CWSidebarMenuItem extends ClassComponent<MenuItem> {
  view(vnode: ResultNode<MenuItem>) {
    if (vnode.attrs.type === 'default') {
      const { disabled, iconLeft, iconRight, isSecondary, label, onclick } =
        vnode.attrs;

      return (
        <div
          className={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'SidebarMenuItem default'
          )}
          onClick={(e) => {
            if (onclick) onclick(e);
          }}
        >
          <div className="sidebar-menu-item-left">
            {iconLeft && <CWIcon iconName={iconLeft} />}
            <CWText type="b2">{label}</CWText>
          </div>
          {iconRight && <CWIcon iconName={iconRight} iconSize="small" />}
        </div>
      );
    } else if (vnode.attrs.type === 'header') {
      return (
        <div className="SidebarMenuItem header">
          <CWText type="caption">{vnode.attrs.label}</CWText>
        </div>
      );
    } else if (vnode.attrs.type === 'community') {
      return renderCommunity(vnode.attrs.community);
    }
  }
}

type SidebarMenuAttrs = {
  className?: string;
  menuHeader?: { label: string; onclick: (e) => void };
  menuItems: Array<MenuItem>;
};

export class CWSidebarMenu extends ClassComponent<SidebarMenuAttrs> {
  view(vnode: ResultNode<SidebarMenuAttrs>) {
    const { className, menuHeader, menuItems } = vnode.attrs;

    return (
      <div
        className={getClasses<{ className: string }>(
          { className },
          ComponentType.SidebarMenu
        )}
      >
        <div className="sidebar-top">
          {menuHeader && (
            <div className="sidebar-menu-header" onClick={menuHeader.onclick}>
              <CWIcon iconName="chevronLeft" />
              <CWText type="h5" fontWeight="medium">
                {menuHeader.label}
              </CWText>
            </div>
          )}
          {menuItems.map((item) => (
            <CWSidebarMenuItem type={item.type || 'default'} {...item} />
          ))}
        </div>
        <div className="sidebar-bottom">
          {[
            {
              type: 'header',
              label: 'Other',
            },
            {
              type: 'default',
              label: 'Explore communities',
              iconLeft: 'compass',
              onclick: () => {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                setRoute('/communities');
              },
            },
            {
              type: 'default',
              label: 'Notification settings',
              iconLeft: 'person',
              onclick: () => {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                setRoute('/notification-settings');
              },
            },
            {
              type: 'default',
              label: 'Account settings',
              iconLeft: 'bell',
              onclick: () => {
                if (app.activeChainId()) {
                  navigateToSubpage('/settings');
                } else {
                  app.sidebarToggled = false;
                  app.sidebarMenu = 'default';
                  setRoute('/settings');
                }
              },
            } as MenuItem,
          ].map((item: MenuItem) => {
            return (
              <CWSidebarMenuItem type={item.type || 'default'} {...item} />
            );
          })}
        </div>
      </div>
    );
  }
}
