import { Feed, FeedItem } from '@knocklabs/client';
import type { GenericData } from '@knocklabs/types';
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

  // Safely access notification data
  let items: FeedItem<GenericData>[] = [];
  let feedClient: Feed | null = null;
  try {
    const notificationsData = useFetchNotifications();
    items = notificationsData.items || [];
    feedClient = notificationsData.feedClient;
  } catch (error) {
    console.error('Error fetching notifications:', error);
  }

  const location = useLocation();
  const pathname = location.pathname;
  const communityId = pathname.split('/')[1];

  const starredCommunities = user.communities?.filter((x) => x.isStarred) || [];
  const unstarredCommunities =
    user.communities?.filter((x) => !x.isStarred) || [];

  const markCommunityNotificationsAsRead = async (communityName) => {
    if (!feedClient || !items || !items.length) return;

    const unreadNotifications = items.filter(
      (item) =>
        !item.seen_at &&
        !item.read_at &&
        item?.data?.community_name === communityName,
    );
    if (unreadNotifications.length === 0) return;
    try {
      await feedClient.markAsRead(unreadNotifications).catch(console.error);
      await feedClient.markAsSeen(unreadNotifications).catch(console.error);
    } catch (error) {
      console.error('Failed to mark notifications as read:');
    }
  };

  return (
    <div
      className={clsx('SidebarQuickSwitcher', { onMobile, isInsideCommunity })}
    >
      <div className="community-nav-bar">
        <CWIconButton
          iconName="plusCirclePhosphor"
          iconButtonTheme="neutral"
          onClick={() => {
            setMenu({ name: 'createContent' });
          }}
        />
        <CWIconButton
          iconName="compassPhosphor"
          iconButtonTheme="neutral"
          onClick={() => {
            setMenu({ name: 'exploreCommunities' });
          }}
        />
        {isWindowSmallInclusive(window.innerWidth) && (
          <CWIconButton
            iconSize="medium"
            iconButtonTheme="neutral"
            iconName="infoEmpty"
            onClick={() => window.open('https://landing.common.xyz', '_blank')}
          />
        )}
      </div>
      <CWDivider />
      <div className="scrollable-community-bar">
        {starredCommunities.length > 0 && (
          <>
            {starredCommunities.map((community) => (
              <div className="community-avatar-container" key={community.id}>
                <CWCommunityAvatar
                  size="large"
                  selectedCommunity={communityId}
                  community={{
                    id: community.id,
                    iconUrl: community.iconUrl,
                    name: community.name,
                  }}
                  onClick={() => {
                    void markCommunityNotificationsAsRead(community.name);

                    navigateToCommunity({
                      navigate,
                      path: '',
                      chain: community.id,
                    });
                  }}
                />
                <SideBarNotificationIcon
                  unreadCount={
                    items && items.length
                      ? calculateUnreadCount(community.name, items)
                      : 0
                  }
                />
              </div>
            ))}
          </>
        )}
        <div className="seprator">
          {user.communities?.filter((x) => x.isStarred)?.length !== 0 && (
            <CWDivider />
          )}
        </div>
        {unstarredCommunities.map((community) => (
          <div className="community-avatar-container" key={community.id}>
            <CWCommunityAvatar
              size="large"
              selectedCommunity={communityId}
              community={{
                id: community.id,
                iconUrl: community.iconUrl,
                name: community.name,
              }}
              onClick={() => {
                void markCommunityNotificationsAsRead(community.name);
                navigateToCommunity({
                  navigate,
                  path: '',
                  chain: community.id,
                });
              }}
            />
            <SideBarNotificationIcon
              unreadCount={
                items && items.length
                  ? calculateUnreadCount(community.name, items)
                  : 0
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};
