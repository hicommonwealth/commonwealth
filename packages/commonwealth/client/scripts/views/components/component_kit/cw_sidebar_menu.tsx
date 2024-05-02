import React, { useEffect } from 'react';

import 'components/component_kit/cw_sidebar_menu.scss';

import useForceRerender from 'hooks/useForceRerender';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { useToggleCommunityStarMutation } from 'state/api/communities';
import useSidebarStore, { sidebarStore } from 'state/ui/sidebar';
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
  // const [isStarred, setIsStarred] = useState<boolean>(!!props.isStarred);
  const { mutateAsync: toggleCommunityStar } = useToggleCommunityStarMutation();

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
  } else if (props.type === 'header') {
    return (
      <div className="SidebarMenuItem header">
        <CWText type="caption">{props.label}</CWText>
      </div>
    );
  } else if (props.type === 'community') {
    const item = props.community;
    const roles = app.roles.getAllRolesInCommunity({ community: item.id });
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
        <CommunityLabel community={item} />
        {app.isLoggedIn() && roles.length > 0 && (
          <div className="roles-and-star">
            <User
              avatarSize={18}
              shouldShowAvatarOnly
              userAddress={roles?.[0]?.address}
              userCommunityId={
                roles?.[0]?.address_chain || roles?.[0]?.community_id
              }
              shouldShowAsDeleted={
                !roles?.[0]?.address &&
                !(roles?.[0]?.address_chain || roles?.[0]?.community_id)
              }
            />
            <div
              className={props.isStarred ? 'star-filled' : 'star-empty'}
              onClick={async (e) => {
                e.stopPropagation();
                await toggleCommunityStar({
                  community: item.id,
                });
                // setIsStarred((prevState) => !prevState);
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
  const forceRerender = useForceRerender();

  useEffect(() => {
    app.sidebarRedraw.on('redraw', forceRerender);

    return () => {
      app.sidebarRedraw.off('redraw', forceRerender);
    };
  }, [forceRerender]);

  return (
    <div
      className={getClasses<{ className: string }>(
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
                ? app.user.isCommunityStarred(item.community.id)
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
