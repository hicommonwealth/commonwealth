import React from 'react';

import { redraw } from 'mithrilInterop';

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
import { useCommonNavigate } from 'navigation/helpers';

export const CWSidebarMenuItem = (props: MenuItem) => {
  const navigate = useCommonNavigate();

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
          navigate(item.id ? `/${item.id}` : '/', {}, null);
        }}
      >
        <CommunityLabel community={item} />
        {app.isLoggedIn() && roles.length > 0 && (
          <div className="roles-and-star">
            <User
              avatarSize={18}
              avatarOnly
              user={
                new AddressInfo(
                  roles[0].address_id,
                  roles[0].address,
                  roles[0].address_chain || roles[0].chain_id,
                  null
                )
              }
            />
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

type SidebarMenuProps = {
  className?: string;
  menuHeader?: { label: string; onClick: (e) => void };
  menuItems: Array<MenuItem>;
};

export const CWSidebarMenu = (props: SidebarMenuProps) => {
  const { className, menuHeader, menuItems } = props;
  const navigate = useCommonNavigate();

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
        {menuItems.map((item, i) => (
          <CWSidebarMenuItem key={i} type={item.type || 'default'} {...item} />
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
              navigate('/communities', {}, null);
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
              navigate('/notification-settings');
            },
          },
          {
            type: 'default',
            label: 'Account settings',
            iconLeft: 'bell',
            onClick: () => {
              if (app.activeChainId()) {
                navigate('/settings');
              } else {
                app.sidebarToggled = false;
                app.sidebarMenu = 'default';
                app.sidebarRedraw.emit('redraw');
                navigate('/settings');
              }
            },
          } as MenuItem,
        ].map((item: MenuItem, i) => {
          return (
            <CWSidebarMenuItem
              key={i}
              type={item.type || 'default'}
              {...item}
            />
          );
        })}
      </div>
    </div>
  );
};
