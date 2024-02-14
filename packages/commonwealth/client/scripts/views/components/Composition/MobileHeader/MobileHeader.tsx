import React, { useState } from 'react';

import app from 'state';

import { useFlag } from 'hooks/useFlag';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { useCommonNavigate } from 'navigation/helpers';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles';
import useAdminOnboardingSliderMutationStore from 'state/ui/adminOnboardingCards';
import useGroupMutationBannerStore from 'state/ui/group';
import UserDropdown from 'views/components/Header/UserDropdown';
import { handleLogout } from 'views/components/Header/UserDropdown/UserDropdown';
import { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import MenuContent from 'views/components/component_kit/CWPopoverMenu/MenuContent';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWToggle } from 'views/components/component_kit/cw_toggle';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { toggleDarkMode } from 'views/components/component_kit/new_designs/cw_toggle';
import CollapsableSidebarButton from 'views/components/sidebar/CollapsableSidebarButton';
import { User } from 'views/components/user/user';
import { AuthModal } from 'views/modals/AuthModal';
import { LoginModal } from 'views/modals/login_modal';

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
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on',
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const { isLoggedIn } = useUserLoggedIn();
  const navigate = useCommonNavigate();
  const newSignInModalEnabled = useFlag('newSignInModal');

  const { clearSetGatingGroupBannerForCommunities } =
    useGroupMutationBannerStore();
  const { clearSetAdminOnboardingCardVisibilityForCommunities } =
    useAdminOnboardingSliderMutationStore();

  const user = app?.user?.addresses?.[0];

  // TODO this will be handled in next ticket
  const magnifyingGlassVisible = false;
  const newUserIcon = true;
  const shouldShow = isInsideCommunity ? !menuVisible : true;

  const { data: users } = useFetchProfilesByAddressesQuery({
    currentChainId: app.activeChainId(),
    profileAddresses: [user?.address],
    profileChainIds: [user?.community?.id],
    apiCallEnabled: !!(user?.address && user?.community?.id),
  });

  const profile = users?.[0];

  return (
    <>
      <div className="MobileHeader">
        {shouldShow && (
          <CollapsableSidebarButton
            onMobile={onMobile}
            isInsideCommunity={isInsideCommunity}
          />
        )}

        <div className="right-side">
          {magnifyingGlassVisible && (
            <CWIconButton
              iconName="magnifyingGlass"
              iconButtonTheme="neutral"
            />
          )}

          {isLoggedIn ? (
            newUserIcon ? (
              <>
                <UserDropdown />
                <div onClick={() => setIsUserDrawerOpen(true)}>
                  <User
                    shouldShowAvatarOnly
                    avatarSize={24}
                    userAddress={user?.address}
                    userCommunityId={user?.community?.id}
                  />
                </div>
              </>
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
      <CWDrawer
        open={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
      >
        <div className="UserDrawer">
          <div className="header">
            <CWIconButton
              iconName="close"
              onClick={() => setIsUserDrawerOpen(false)}
            />
            <CWText fontWeight="medium" className="name">
              {profile?.name}
            </CWText>
            <User
              shouldShowAvatarOnly
              avatarSize={24}
              userAddress={user?.address}
              userCommunityId={user?.community?.id}
            />
          </div>

          <MenuContent
            menuItems={[
              ...(app.user.activeAccounts.length > 0
                ? ([
                    {
                      type: 'header',
                      label: 'Addresses',
                    },
                    // ...addresses,
                    {
                      type: 'default',
                      label: 'Connect a new address',
                      onClick: () => {
                        setIsUserDrawerOpen(false);
                        setIsAuthModalOpen(true);
                      },
                    },
                    { type: 'divider' },
                  ] as PopoverMenuItem[])
                : []),
              {
                type: 'header',
                label: 'Settings',
              },
              {
                type: 'default',
                label: 'View profile',
                onClick: () => navigate(`/profile/id/${'asd'}`, {}, null),
              },
              {
                type: 'default',
                label: 'Edit profile',
                onClick: () => navigate(`/profile/edit`, {}, null),
              },
              {
                type: 'default',
                label: 'Notifications',
                onClick: () => navigate('/notification-settings', {}, null),
              },
              {
                type: 'default',
                label: (
                  <div className="UserDropdownItem">
                    <div>Dark mode</div>
                    <CWToggle readOnly checked={false} />
                  </div>
                ),
                preventClosing: true,
                onClick: () => toggleDarkMode(!isDarkModeOn, setIsDarkModeOn),
              },
              {
                type: 'default',
                label: 'Sign out',
                onClick: () => {
                  clearSetGatingGroupBannerForCommunities();
                  clearSetAdminOnboardingCardVisibilityForCommunities();
                  handleLogout();
                },
              },
            ]}
          />
        </div>
      </CWDrawer>
      {!newSignInModalEnabled ? (
        <CWModal
          content={
            <LoginModal onModalClose={() => setIsAuthModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsAuthModalOpen(false)}
          open={isAuthModalOpen}
        />
      ) : (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          isOpen={isAuthModalOpen}
        />
      )}
    </>
  );
};

export default MobileHeader;
