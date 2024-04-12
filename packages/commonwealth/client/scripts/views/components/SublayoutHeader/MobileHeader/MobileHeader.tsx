import React, { useState } from 'react';

import app from 'state';
import useSidebarStore from 'state/ui/sidebar';

import { WalletSsoSource } from '@hicommonwealth/shared';
import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import MenuContent from 'views/components/component_kit/CWPopoverMenu/MenuContent';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import CollapsableSidebarButton from 'views/components/sidebar/CollapsableSidebarButton';
import { User } from 'views/components/user/user';
import MobileSearchModal from 'views/modals/MobileSearchModal';

import useUserMenuItems from '../useUserMenuItems';

import './MobileHeader.scss';

interface MobileHeaderProps {
  onMobile: boolean;
  isInsideCommunity: boolean;
  onAuthModalOpen: (open: boolean) => void;
  onRevalidationModalData: ({
    walletSsoSource,
    walletAddress,
  }: {
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }) => void;
  onFeedbackModalOpen: (open: boolean) => void;
}

const MobileHeader = ({
  onMobile,
  onAuthModalOpen,
  isInsideCommunity,
  onRevalidationModalData,
  onFeedbackModalOpen,
}: MobileHeaderProps) => {
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isModalOpen, isSetModalOpen] = useState(false);
  const { isLoggedIn } = useUserLoggedIn();
  const { menuVisible } = useSidebarStore();
  const user = app?.user?.addresses?.[0];

  const magnifyingGlassVisible = true;
  const shouldShowCollapsableSidebarButton = isInsideCommunity
    ? !menuVisible
    : true;

  const userMenuItems = useUserMenuItems({
    onAuthModalOpen,
    onRevalidationModalData,
    isMenuOpen: isUserDrawerOpen,
    onAddressItemClick: () => setIsUserDrawerOpen(false),
  });

  const mobileItems = [
    ...userMenuItems,
    { type: 'divider' },
    {
      type: 'header',
      label: 'Help',
    },
    {
      label: 'Help documentation',
      onClick: () => window.open('https://docs.commonwealth.im/commonwealth/'),
    },
    {
      label: 'Send feedback',
      onClick: () => {
        onFeedbackModalOpen(true);
        setIsUserDrawerOpen(false);
      },
    },
  ] as PopoverMenuItem[];

  return (
    <>
      <div className="MobileHeader">
        {shouldShowCollapsableSidebarButton && (
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
              onClick={() => isSetModalOpen(true)}
            />
          )}

          {isLoggedIn ? (
            <div onClick={() => setIsUserDrawerOpen(true)}>
              <User
                shouldShowAvatarOnly
                avatarSize={24}
                userAddress={user?.address}
                userCommunityId={user?.community?.id}
              />
            </div>
          ) : (
            <CWButton
              label="Sign in"
              buttonHeight="sm"
              disabled={location.pathname.includes('/finishsociallogin')}
              onClick={() => onAuthModalOpen(true)}
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
              <User
                shouldHideAvatar
                userAddress={user?.address}
                userCommunityId={user?.community?.id}
              />
            </CWText>
            <User
              shouldShowAvatarOnly
              avatarSize={24}
              userAddress={user?.address}
              userCommunityId={user?.community?.id}
            />
          </div>

          <MenuContent menuItems={mobileItems} />
        </div>
      </CWDrawer>

      <CWModal
        isFullScreen
        content={
          <MobileSearchModal onModalClose={() => isSetModalOpen(false)} />
        }
        onClose={() => isSetModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};

export default MobileHeader;
