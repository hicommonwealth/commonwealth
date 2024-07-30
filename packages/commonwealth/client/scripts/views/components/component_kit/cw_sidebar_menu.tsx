import React, { useState } from 'react';

import 'components/component_kit/cw_sidebar_menu.scss';

import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useToggleCommunityStarMutation } from 'state/api/communities';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
import useUserStore, { userStore } from 'state/ui/user';
import { CommunityLabel } from '../community_label';
import { User } from '../user/user';
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
    const account =
      item &&
      userStore
        .getState()
        .accounts.find(({ community }) => item.id === community.id);
    return (
      <div
        className={getClasses<{ isSelected: boolean }>(
          // @ts-expect-error <StrictNullChecks/>
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
            // @ts-expect-error <StrictNullChecks/>
            chain: item.id,
          });
        }}
      >
        {/*// @ts-expect-error <StrictNullChecks/>*/}
        <CommunityLabel community={item} />
        {app.isLoggedIn() && account && (
          <div className="roles-and-star">
            <User
              avatarSize={18}
              shouldShowAvatarOnly
              userAddress={account.address}
              userCommunityId={account.community.id}
            />
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
  const { setMenu } = useSidebarStore();

  const user = useUserStore();

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
              item.type === 'community'
                ? !!user.starredCommunities.find(
                    (starCommunity) =>
                      starCommunity.community_id ===
                      (item?.community?.id || ''),
                  )
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
            iconLeft: 'compassPhosphor',
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
