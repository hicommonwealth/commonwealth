/* @jsx jsx */
import React from 'react';

import { setRoute, jsx, redraw } from 'mithrilInterop';
import { NavigationWrapper } from 'mithrilInterop/helpers';
import { navigateToSubpage } from 'router';

import 'components/component_kit/cw_sidebar_menu.scss';
import { AddressInfo } from 'models';

import app from 'state';
import { CommunityLabel } from '../community_label';
import { User } from '../user/user';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import type { MenuItem } from './types';
import { ComponentType } from './types';

const CWSidebarMenuItemComponent = (props: MenuItem) => {
  if (props.type === 'default') {
    const { disabled, iconLeft, iconRight, isSecondary, label, onClick } =
      props;

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
  } else if (props.type === 'header') {
    return (
      <div className="SidebarMenuItem header">
        <CWText type="caption">{props.label}</CWText>
      </div>
    );
  } else if (props.type === 'community') {
    const item = props.community;
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
          app.sidebarRedraw.emit('redraw');
          setRoute(item.id ? `/${item.id}` : '/');
        }}
      >
        <CommunityLabel community={item} />
        {app.isLoggedIn() && roles.length > 0 && (
          <div className="roles-and-star">
            {roles.map((role) => {
              return (
                <User
                  avatarSize={18}
                  avatarOnly
                  user={
                    new AddressInfo(
                      role.address_id,
                      role.address,
                      role.address_chain || role.chain_id,
                      null
                    )
                  }
                />
              );
            })}
            <div
              className={
                app.communities.isStarred(item.id)
                  ? 'star-filled'
                  : 'star-empty'
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
};

const CWSidebarMenuItem = NavigationWrapper(CWSidebarMenuItemComponent);

type SidebarMenuProps = {
  className?: string;
  menuHeader?: { label: string; onClick: (e) => void };
  menuItems: Array<MenuItem>;
};

const CWSidebarMenuComponent = (props: SidebarMenuProps) => {
  const { className, menuHeader, menuItems } = props;

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
              app.sidebarRedraw.emit('redraw');
              setRoute('/communities');
            },
          },
          {
            type: 'default',
            label: 'Notification settings',
            iconLeft: 'person',
            onClick: () => {
              app.sidebarToggled = false;
              app.sidebarMenu = 'default';
              app.sidebarRedraw.emit('redraw');
              setRoute('/notification-settings');
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
                app.sidebarRedraw.emit('redraw');
                setRoute('/settings');
              }
            },
          } as MenuItem,
        ].map((item: MenuItem) => {
          return <CWSidebarMenuItem type={item.type || 'default'} {...item} />;
        })}
      </div>
    </div>
  );
};

export const CWSidebarMenu = NavigationWrapper(CWSidebarMenuComponent);
