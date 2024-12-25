import useFetchNotifications from 'client/scripts/state/api/notifications/useFetchNotifications';
import clsx from 'clsx';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import { useLocation } from 'react-router-dom';
import useSidebarStore from 'state/ui/sidebar';
import useUserStore from 'state/ui/user';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWDivider } from '../component_kit/cw_divider';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { isWindowSmallInclusive } from '../component_kit/helpers';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
import { SideBarNotificationIcon } from './SidebarNotificationIcon';
import { calculateUnreadCount } from './helpers';
import './sidebar_quick_switcher.scss';

export const SidebarQuickSwitcher = ({
  isInsideCommunity,
  onMobile,
}: {
  isInsideCommunity: boolean;
  onMobile: boolean;
}) => {
  const navigate = useCommonNavigate();
  const { setMenu } = useSidebarStore();
  const user = useUserStore();

  const { items } = useFetchNotifications();

  const location = useLocation();
  const pathname = location.pathname;
  const communityId = pathname.split('/')[1];

  return (
    <div
      className={clsx('SidebarQuickSwitcher', { onMobile, isInsideCommunity })}
    >
      <div className="community-nav-bar">
        {user.isLoggedIn && (
          <CWIconButton
            iconName="plusCirclePhosphor"
            iconButtonTheme="neutral"
            onClick={() => {
              setMenu({ name: 'createContent' });
            }}
          />
        )}
        <CWIconButton
          iconName="compassPhosphor"
          iconButtonTheme="neutral"
          onClick={() => {
            setMenu({ name: 'exploreCommunities' });
          }}
        />
        {isWindowSmallInclusive(window.innerWidth) && (
          <CWTooltip
            content="About Common"
            placement="bottom"
            renderTrigger={(handleInteraction) => (
              <CWIconButton
                iconButtonTheme="neutral"
                iconName="infoEmpty"
                onClick={() =>
                  window.open('https://landing.common.xyz', '_blank')
                }
                onMouseEnter={handleInteraction}
                onMouseLeave={handleInteraction}
              />
            )}
          />
        )}
      </div>
      <CWDivider />
      {user.communities.filter((x) => x.isStarred).length !== 0 && (
        <div className="scrollable-community-bar">
          {user.communities
            .filter((x) => x.isStarred)
            .map((community) => (
              <div className="community-avatar-container" key={community.id}>
                <CWCommunityAvatar
                  key={community.id}
                  size="large"
                  selectedCommunity={communityId}
                  community={{
                    id: community.id,
                    iconUrl: community.iconUrl,
                    name: community.name,
                  }}
                  onClick={() =>
                    navigateToCommunity({
                      navigate,
                      path: '',
                      chain: community.id,
                    })
                  }
                />
                <SideBarNotificationIcon
                  unreadCount={calculateUnreadCount(community.name, items)}
                />
              </div>
            ))}
        </div>
      )}
      {user.communities.filter((x) => x.isStarred).length !== 0 && (
        <CWDivider />
      )}
      <div className="scrollable-community-bar">
        {user.communities
          .filter((x) => !x.isStarred)
          .map((community) => (
            <div className="community-avatar-container" key={community.id}>
              <CWCommunityAvatar
                key={community.id}
                size="large"
                selectedCommunity={communityId}
                community={{
                  id: community.id,
                  iconUrl: community.iconUrl,
                  name: community.name,
                }}
                onClick={() =>
                  navigateToCommunity({
                    navigate,
                    path: '',
                    chain: community.id,
                  })
                }
              />
              <SideBarNotificationIcon
                unreadCount={calculateUnreadCount(community.name, items)}
              />
            </div>
          ))}
      </div>
    </div>
  );
};
