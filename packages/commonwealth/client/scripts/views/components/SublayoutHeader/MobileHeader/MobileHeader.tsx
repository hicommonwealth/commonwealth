import React, { useState } from 'react';

import useSidebarStore from 'state/ui/sidebar';

import useUserLoggedIn from 'hooks/useUserLoggedIn';
import { PopoverMenuItem } from 'views/components/component_kit/CWPopoverMenu';
import MenuContent from 'views/components/component_kit/CWPopoverMenu/MenuContent';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import CWDrawer from 'views/components/component_kit/new_designs/CWDrawer';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import CollapsableSidebarButton from 'views/components/sidebar/CollapsableSidebarButton';
import { User } from 'views/components/user/user';
import MobileSearchModal from 'views/modals/MobileSearchModal';

import useUserMenuItems from '../useUserMenuItems';

import useUserStore from 'state/ui/user';
import { AuthModalType } from 'views/modals/AuthModal';
import './MobileHeader.scss';

interface MobileHeaderProps {
  onMobile: boolean;
  isInsideCommunity: boolean;
  onAuthModalOpen: (modalType?: AuthModalType) => void;
}

const MobileHeader = ({
  onMobile,
  onAuthModalOpen,
  isInsideCommunity,
}: MobileHeaderProps) => {
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const [isModalOpen, isSetModalOpen] = useState(false);
  const { isLoggedIn } = useUserLoggedIn();
  const { menuVisible } = useSidebarStore();
  const userData = useUserStore();
  const user = userData.addresses?.[0];

  const magnifyingGlassVisible = true;
  const shouldShowCollapsableSidebarButton = isInsideCommunity
    ? !menuVisible
    : true;

  const { userMenuItems } = useUserMenuItems({
    onAuthModalOpen,
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

          {isLoggedIn && (
            <div onClick={() => setIsUserDrawerOpen(true)}>
              <User
                shouldShowAvatarOnly
                avatarSize={24}
                userAddress={user?.address}
                userCommunityId={user?.community?.id}
              />
            </div>
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
