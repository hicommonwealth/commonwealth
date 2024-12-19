import clsx from 'clsx';
import { navigateToCommunity, useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import useSidebarStore from 'state/ui/sidebar';
import useUserStore from 'state/ui/user';
import { CWCommunityAvatar } from '../component_kit/cw_community_avatar';
import { CWDivider } from '../component_kit/cw_divider';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { isWindowSmallInclusive } from '../component_kit/helpers';
import { CWTooltip } from '../component_kit/new_designs/CWTooltip';
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
      <div className="scrollable-community-bar">
        {user.communities
          .filter((x) => x.isStarred)
          .map((community) => (
            <CWCommunityAvatar
              key={community.id}
              size="large"
              community={{
                iconUrl: community.iconUrl,
                name: community.name,
              }}
              onClick={() =>
                navigateToCommunity({ navigate, path: '', chain: community.id })
              }
            />
          ))}
      </div>
    </div>
  );
};
