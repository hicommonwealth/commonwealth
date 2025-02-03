import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';

import './cw_sidebar_menu.scss';

import useBrowserWindow from 'client/scripts/hooks/useBrowserWindow';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useToggleCommunityStarMutation } from 'state/api/communities';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import useUserStore from 'state/ui/user';
import { CommunityLabel } from '../community_label';
import { CWIcon } from './cw_icons/cw_icon';
import { CWText } from './cw_text';
import { getClasses, isWindowSmallInclusive } from './helpers';
import { CWButton } from './new_designs/CWButton';
import type { MenuItem } from './types';
import { ComponentType } from './types';

type CWSidebarMenuItemProps = {
  isStarred?: boolean;
} & MenuItem;

const resetSidebarState = () => {
  if (
    sidebarStore.getState().userToggledVisibility !== 'open' ||
    isWindowSmallInclusive(window.innerWidth)
  ) {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: false });
  } else {
    sidebarStore.getState().setMenu({ name: 'default', isVisible: true });
  }
};

export const CWSidebarMenuItem = (props: CWSidebarMenuItemProps) => {
  const navigate = useCommonNavigate();
  const { setMenu } = useSidebarStore();
  const user = useUserStore();

  // eslint-disable-next-line react/destructuring-assignment
  const [isStarred, setIsStarred] = useState<boolean>(!!props.isStarred);
  const { mutateAsync: toggleCommunityStar } = useToggleCommunityStarMutation();

  /* eslint-disable-next-line react/destructuring-assignment */
  if (props.type === 'default') {
    const {
      disabled,
      iconLeft,
      iconLeftWeight,
      iconRight,
      isSecondary,
      label,
      onClick,
      isButton,
      className,
    } = props;

    if (isButton) {
      return (
        <CWButton
          containerClassName={`${className} px-16 no-outline`}
          key={label as string}
          label={label}
          buttonHeight="sm"
          buttonWidth="full"
          iconLeft={iconLeft}
          iconLeftWeight={iconLeftWeight}
          disabled={disabled}
          onClick={onClick}
        />
      );
    }

    return (
      <div
        className={getClasses<{ disabled?: boolean; isSecondary?: boolean }>(
          { disabled, isSecondary },
          'SidebarMenuItem default',
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
    /* eslint-disable-next-line react/destructuring-assignment */
  } else if (props.type === 'header') {
    return (
      <div className="SidebarMenuItem header">
        {/* eslint-disable-next-line react/destructuring-assignment */}
        <CWText type="caption">{props.label}</CWText>
      </div>
    );
    /* eslint-disable-next-line react/destructuring-assignment */
  } else if (props.type === 'community') {
    /* eslint-disable-next-line react/destructuring-assignment */
    const item = props.community;
    if (!item) return <></>;

    return (
      <div
        className={getClasses<{ isSelected: boolean }>(
          { isSelected: app.activeChainId() === item.id },
          'SidebarMenuItem community',
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenu({ name: 'default', isVisible: false });
          resetSidebarState();
          navigateToCommunity({
            navigate,
            path: '/',
            chain: item.id,
          });
        }}
      >
        {item && (
          <CommunityLabel name={item.name || ''} iconUrl={item.iconUrl} />
        )}
        {user.isLoggedIn && (
          <div className="roles-and-star">
            <div
              className={isStarred ? 'star-filled' : 'star-empty'}
              onClick={async (e) => {
                e.stopPropagation();
                await toggleCommunityStar({
                  community: item.id,
                });
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

// eslint-disable-next-line react/no-multi-comp
export const CWSidebarMenu = (props: SidebarMenuProps) => {
  const { className, menuHeader, menuItems } = props;
  const navigate = useCommonNavigate();
  const { setMenu, menuName, menuVisible } = useSidebarStore();
  const { isWindowSmallInclusive: isWindowSmall } = useBrowserWindow({});
  return (
    <div
      className={getClasses<{ className: string }>(
        // @ts-expect-error <StrictNullChecks/>
        { className },
        ComponentType.SidebarMenu,
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
              item.type === 'community' ? item.community?.isStarred : false,
          };

          if (item.type === 'element') {
            return item.element;
          }

          return (
            <CWSidebarMenuItem
              key={`${i}-${
                item?.type === 'community' ? item?.community?.isStarred : false
              }`}
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
            label: 'Explore',
            iconLeft: 'compassPhosphor',
            onClick: () => {
              if (isMobile && isWindowSmall) {
                setMenu({ name: 'default', isVisible: menuVisible });
              } else {
                setMenu({ name: menuName, isVisible: menuVisible });
              }
              navigate('/explore', {}, null);
            },
          },
          {
            type: 'default',
            label: 'Notification settings',
            iconLeft: 'person',
            onClick: () => {
              if (isMobile && isWindowSmall) {
                setMenu({ name: 'default', isVisible: menuVisible });
              } else {
                setMenu({ name: menuName, isVisible: menuVisible });
              }
              navigate('/notification-settings');
            },
          } as MenuItem,
        ].map((item: MenuItem, i) => {
          if (item.type === 'element') return <></>;

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
