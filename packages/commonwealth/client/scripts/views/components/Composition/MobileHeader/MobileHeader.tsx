import React from 'react';

import app from 'state';

import useUserLoggedIn from 'hooks/useUserLoggedIn';
import UserDropdown from 'views/components/Header/UserDropdown';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import CollapsableSidebarButton from 'views/components/sidebar/CollapsableSidebarButton';
import { User } from 'views/components/user/user';

import './MobileHeader.scss';

interface MobileHeaderProps {
  onMobile: boolean;
  onSignInClick: () => void;
  isInsideCommunity: boolean;
  menuVisible: boolean;
}

const MobileHeader = ({
  onMobile,
  onSignInClick,
  isInsideCommunity,
  menuVisible,
}: MobileHeaderProps) => {
  const { isLoggedIn } = useUserLoggedIn();

  const user = app?.user?.addresses?.[0];

  // TODO this will be handled in next ticket
  const magnifyingGlassVisible = false;
  const newUserIcon = false;
  const shouldShow = isInsideCommunity ? !menuVisible : true;

  return (
    <div className="MobileHeader">
      {shouldShow && (
        <CollapsableSidebarButton
          onMobile={onMobile}
          isInsideCommunity={isInsideCommunity}
        />
      )}

      <div className="right-side">
        {magnifyingGlassVisible && (
          <CWIconButton iconName="magnifyingGlass" iconButtonTheme="neutral" />
        )}

        {isLoggedIn ? (
          newUserIcon ? (
            <User
              shouldShowAvatarOnly
              avatarSize={24}
              userAddress={user?.address}
              userCommunityId={user?.community?.id}
            />
          ) : (
            <UserDropdown />
          )
        ) : (
          <CWButton
            label="Sign in"
            buttonHeight="sm"
            disabled={location.pathname.includes('/finishsociallogin')}
            onClick={onSignInClick}
          />
        )}
      </div>
    </div>
  );
};

export default MobileHeader;
