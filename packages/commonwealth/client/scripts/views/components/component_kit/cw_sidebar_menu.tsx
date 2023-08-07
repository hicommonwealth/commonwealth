import React, { useState } from 'react';

import 'components/component_kit/cw_sidebar_menu.scss';

import app from 'state';
import AddressInfo from '../../../models/AddressInfo';
import { CommunityLabel } from '../community_label';
import { User } from '../user/user';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses } from './helpers';
import type { MenuItem } from './types';
import { ComponentType } from './types';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import useSidebarStore from 'state/ui/sidebar';
import { featureFlags } from 'helpers/feature-flags';

type CWSidebarMenuItemProps = {
  isStarred?: boolean;
} & MenuItem;

export const CWSidebarMenuItem = (props: CWSidebarMenuItemProps) => {
  const navigate = useCommonNavigate();
  const { setMenu } = useSidebarStore();
  const [isStarred, setIsStarred] = useState<boolean>(!!props.isStarred);

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
          setMenu({ name: 'default', isVisible: false });
          navigateToCommunity({
            navigate,
            path: '/',
            chain: item.id,
          });
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
              className={isStarred ? 'star-filled' : 'star-empty'}
              onClick={async (e) => {
                e.stopPropagation();
                await app.communities.setStarred(item.id);
                setIsStarred((prevState) => !prevState);
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
  const { setMenu } = useSidebarStore();

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
        {menuItems.map((item, i) => {
          const itemProps = {
            ...item,
            isStarred:
              item.type === 'community'
                ? app.communities.isStarred(item.community.id)
                : false,
          };

          return (
            <CWSidebarMenuItem
              key={i}
              type={item.type || 'default'}
              {...itemProps}
            />
          );
        })}
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
            iconLeft: featureFlags.sessionKeys ? 'compassPhosphor' : 'compass',
            onClick: () => {
              setMenu({ name: 'default', isVisible: false });
              navigate('/communities', {}, null);
            },
          },
          {
            type: 'default',
            label: 'Notification settings',
            iconLeft: 'person',
            onClick: () => {
              setMenu({ name: 'default', isVisible: false });
              navigate('/notification-settings');
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
