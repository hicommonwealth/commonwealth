/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';
// import { ListItem, Icon, Icons } from 'construct-ui';
import { NavigationWrapper } from 'mithrilInterop/helpers';

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

class CWSidebarMenuItemComponent extends ClassComponent<MenuItem> {
  view(vnode: ResultNode<MenuItem>) {
    if (vnode.attrs.type === 'default') {
      const { disabled, iconLeft, iconRight, isSecondary, label, onClick } =
        vnode.attrs;

      return (
        <div
          className={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
            { disabled, isSecondary },
            'SidebarMenuItem default'
          )}
          onClick={(e) => {
            if (onClick) onClick(e);
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
      const item = vnode.attrs.community;
      const roles = app.roles.getAllRolesInCommunity({ chain: item.id });
      return (
        <div
          className={getClasses<{ isSelected: boolean }>(
            { isSelected: app.activeChainId() === item.id },
            'SidebarMenuItem community'
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            app.sidebarToggled = false;
            app.sidebarMenu = 'default';
            this.setRoute(item.id ? `/${item.id}` : '/');
          }}
        >
          <CommunityLabel community={item} />
          {app.isLoggedIn() && roles.length > 0 && (
            <div className="roles-and-star">
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
                className={
                  app.communities.isStarred(item.id) ? 'star-filled' : 'star-empty'
                }
                onClick={async (e) => {
                  e.stopPropagation();
                  await app.communities.setStarred(item.id);
                  redraw();
                }}
              />
            </div>
          )}
        </div>
      );
    }
  }
}

const CWSidebarMenuItem = NavigationWrapper(CWSidebarMenuItemComponent);

type SidebarMenuAttrs = {
  className?: string;
  menuHeader?: { label: string; onClick: (e) => void };
  menuItems: Array<MenuItem>;
};

class CWSidebarMenuComponent extends ClassComponent<SidebarMenuAttrs> {
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
            <div className="sidebar-menu-header" onClick={menuHeader.onClick}>
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
              onClick: () => {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                this.setRoute('/communities');
              },
            },
            {
              type: 'default',
              label: 'Notification settings',
              iconLeft: 'person',
              onClick: () => {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                this.setRoute('/notification-settings');
              },
            },
            {
              type: 'default',
              label: 'Account settings',
              iconLeft: 'bell',
              onClick: () => {
                if (app.activeChainId()) {
                  navigateToSubpage('/settings');
                } else {
                  app.sidebarToggled = false;
                  app.sidebarMenu = 'default';
                  this.setRoute('/settings');
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

export const CWSidebarMenu = NavigationWrapper(CWSidebarMenuComponent);